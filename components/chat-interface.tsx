'use client';

import type React from 'react';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Send, Settings, RefreshCw } from 'lucide-react';
import ConfigForm from './config-form';
import {
  sendMessageToCoze,
  generateUserId,
  retrieveConversationMessages,
} from '@/lib/api';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

type Config = {
  apiKey: string;
  botId: string;
  userId: string;
  conversationId?: string;
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<Config | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load config from localStorage on component mount
  useEffect(() => {
    const savedConfig = localStorage.getItem('cozeConfig');
    if (savedConfig) {
      try {
        const parsedConfig = JSON.parse(savedConfig);
        // Ensure userId exists
        if (!parsedConfig.userId) {
          parsedConfig.userId = generateUserId();
          localStorage.setItem('cozeConfig', JSON.stringify(parsedConfig));
        }
        setConfig(parsedConfig);

        // 如果有conversationId，尝试加载历史消息
        if (parsedConfig.conversationId) {
          loadConversationHistory(parsedConfig);
        }
      } catch (e) {
        localStorage.removeItem('cozeConfig');
      }
    }
  }, []);

  // 加载会话历史
  const loadConversationHistory = async (currentConfig: Config) => {
    if (!currentConfig.conversationId || !currentConfig.apiKey) return;

    setIsLoadingHistory(true);
    setError(null);

    try {
      const result = await retrieveConversationMessages(
        currentConfig.conversationId,
        currentConfig.apiKey
      );

      if (result.success && result.messages) {
        // 转换消息格式并按时间排序
        const historyMessages: Message[] = result.messages
          .filter(
            (msg) =>
              msg.role === 'user' ||
              (msg.role === 'assistant' && msg.type === 'answer')
          )
          .map((msg) => ({
            id: msg.id,
            role: msg.role as 'user' | 'assistant',
            content: msg.content,
          }))
          // 确保按照正确的时间顺序排序
          .sort((a, b) => {
            // 使用消息的创建时间进行排序
            const timeA =
              result.messages.find((m) => m.id === a.id)?.created_at || 0;
            const timeB =
              result.messages.find((m) => m.id === b.id)?.created_at || 0;

            return timeA - timeB;
          });

        setMessages(historyMessages);
      } else if (result.error) {
        setError(`加载历史消息失败: ${result.error}`);
      }
    } catch (err) {
      setError('加载历史消息失败，请重试');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !config) {
      if (!config) {
        setConfigOpen(true);
      }
      return;
    }

    // Add user message to chat
    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      // Add an empty assistant message that will be updated with streaming content
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '思考中...' },
      ]);

      // Send message to API with streaming
      const { error, conversationId } = await sendMessageToCoze(
        input,
        config,
        (chunk) => {
          // Update the assistant message with each chunk
          setMessages((prev) => {
            const updated = [...prev];
            const lastIndex = updated.length - 1;

            // Replace "思考中..." with the first chunk, then append subsequent chunks
            if (updated[lastIndex].content === '思考中...') {
              updated[lastIndex] = {
                role: 'assistant',
                content: chunk,
              };
            } else {
              updated[lastIndex] = {
                role: 'assistant',
                content: updated[lastIndex].content + chunk,
              };
            }
            return updated;
          });
        }
      );

      // 如果获取到了新的conversationId，更新配置
      if (conversationId && conversationId !== config.conversationId) {
        const updatedConfig = { ...config, conversationId };
        setConfig(updatedConfig);
        localStorage.setItem('cozeConfig', JSON.stringify(updatedConfig));
      }

      if (error) {
        setError(error);
        // Update the placeholder message to show the error
        setMessages((prev) => {
          const updated = [...prev];
          const lastIndex = updated.length - 1;
          if (updated[lastIndex].role === 'assistant') {
            updated[lastIndex] = {
              role: 'assistant',
              content: `错误: ${error}`,
            };
          }
          return updated;
        });
      }
    } catch (err) {
      setError('发送消息失败，请重试');
      // Update the placeholder message to show the error
      setMessages((prev) => {
        const updated = [...prev];
        const lastIndex = updated.length - 1;
        if (updated[lastIndex].role === 'assistant') {
          updated[lastIndex] = {
            role: 'assistant',
            content: '错误: 发送消息失败，请重试',
          };
        }
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfigSaved = (newConfig: Config) => {
    setConfig(newConfig);
    localStorage.setItem('cozeConfig', JSON.stringify(newConfig));

    // 如果配置中有conversationId，尝试加载历史消息
    if (newConfig.conversationId) {
      loadConversationHistory(newConfig);
    }
  };

  const handleRefreshHistory = () => {
    if (config) {
      loadConversationHistory(config);
    }
  };

  return (
    <div className="flex flex-col h-[90vh]">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">扣子 API 聊天演示</h1>
        <div className="flex items-center gap-2">
          {config?.conversationId && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshHistory}
              disabled={isLoadingHistory}
              title="刷新历史消息"
            >
              {isLoadingHistory ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setConfigOpen(true)}
            className="flex items-center gap-1"
          >
            <Settings className="h-4 w-4" />
            <span>配置</span>
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto mb-4 p-4 space-y-3 rounded-md border">
        {isLoadingHistory ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
            <p className="text-gray-400">加载历史消息中...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            {!config ? (
              <>
                <p className="text-gray-400 text-center">
                  请先配置扣子 API 凭据
                </p>
                <Button onClick={() => setConfigOpen(true)}>配置 API</Button>
              </>
            ) : (
              <p className="text-gray-400">发送消息开始聊天</p>
            )}
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100'
                }`}
              >
                {message.content}
              </div>
            </div>
          ))
        )}
        {error && !messages.some((m) => m.content.startsWith('错误:')) && (
          <div className="bg-red-50 p-3 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <Textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={config ? '输入消息...' : '请先配置 API 凭据'}
          className="w-full resize-none pr-12 min-h-[64px] max-h-[150px] py-3"
          disabled={isLoading || isLoadingHistory || !config}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute bottom-3 right-3"
          disabled={isLoading || isLoadingHistory || !input.trim() || !config}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>

      <ConfigForm
        open={configOpen}
        onOpenChange={setConfigOpen}
        onConfigSaved={handleConfigSaved}
        initialConfig={config || undefined}
      />
    </div>
  );
}
