type CozeResponse = {
  content?: string
  error?: string
}

type CozeConfig = {
  apiKey: string
  botId: string
  userId: string
  conversationId?: string
}

export async function sendMessageToCoze(
  message: string,
  config: CozeConfig,
  onChunk?: (chunk: string) => void,
): Promise<CozeResponse & { conversationId?: string }> {
  try {
    const { apiKey, botId, userId, conversationId } = config

    if (!apiKey) {
      return { error: "API 密钥未配置" }
    }

    if (!botId) {
      return { error: "智能体 ID 未配置" }
    }

    // 构建请求URL，如果有conversationId则添加到URL中
    let url = "https://api.coze.cn/v3/chat"
    if (conversationId) {
      url += `?conversation_id=${conversationId}`
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bot_id: botId,
        user_id: userId,
        stream: true,
        auto_save_history: true,
        additional_messages: [
          {
            role: "user",
            content: message,
            content_type: "text",
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return {
        error: `API 错误: ${response.status} ${response.statusText}`,
      }
    }

    // 用于存储从响应中提取的conversationId
    let extractedConversationId: string | undefined

    // Handle streaming response
    if (response.body) {
      let fullContent = ""
      let currentEvent = ""
      let currentData = ""

      const reader = response.body.getReader()
      const decoder = new TextDecoder()

      // Process the stream
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // Process each line in the chunk
        const lines = chunk.split("\n")

        for (const line of lines) {
          // Process event line
          if (line.startsWith("event:")) {
            currentEvent = line.substring(6).trim()
            continue
          }

          // Process data line
          if (line.startsWith("data:")) {
            currentData = line.substring(5).trim()

            // Skip "[DONE]" message
            if (currentData === '"[DONE]"') continue

            try {
              const jsonData = JSON.parse(currentData)

              // 从chat事件中提取conversationId
              if (
                currentEvent === "conversation.chat.created" ||
                currentEvent === "conversation.chat.in_progress" ||
                currentEvent === "conversation.chat.completed"
              ) {
                if (jsonData.conversation_id && !extractedConversationId) {
                  extractedConversationId = jsonData.conversation_id
                }
              }

              // Handle message delta events
              if (currentEvent === "conversation.message.delta") {
                if (jsonData.role === "assistant" && jsonData.type === "answer" && jsonData.content) {
                  fullContent += jsonData.content

                  // Call the onChunk callback if provided
                  if (onChunk && typeof onChunk === "function") {
                    onChunk(jsonData.content)
                  }
                }
              }

              // Handle error events
              if (currentEvent === "error") {
                return { error: `API 错误: ${jsonData.code} ${jsonData.msg}` }
              }
            } catch (e) {
              // Silently ignore parsing errors
            }

            // Reset for next event-data pair
            currentEvent = ""
            currentData = ""
          }
        }
      }

      return {
        content: fullContent,
        conversationId: extractedConversationId || conversationId,
      }
    }

    return { error: "未收到响应" }
  } catch (error) {
    return {
      error: `发送消息失败: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function retrieveConversation(
  conversationId: string,
  apiKey: string,
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch(`https://api.coze.cn/v1/conversation/retrieve?conversation_id=${conversationId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (data.code === 0) {
      return { success: true, data: data.data }
    } else {
      return { success: false, error: data.msg || "获取会话信息失败" }
    }
  } catch (error) {
    return {
      success: false,
      error: `获取会话信息失败: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export async function retrieveConversationMessages(
  conversationId: string,
  apiKey: string,
): Promise<{ success: boolean; messages?: any[]; error?: string }> {
  try {
    const response = await fetch(`https://api.coze.cn/v1/conversation/message/list?conversation_id=${conversationId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    })

    const data = await response.json()

    if (data.code === 0 && data.data) {
      return { success: true, messages: data.data }
    } else {
      return { success: false, error: data.msg || "获取会话消息失败" }
    }
  } catch (error) {
    return {
      success: false,
      error: `获取会话消息失败: ${error instanceof Error ? error.message : String(error)}`,
    }
  }
}

export function generateUserId(): string {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

