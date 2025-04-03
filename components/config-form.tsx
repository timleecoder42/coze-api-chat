'use client';

import type React from 'react';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { generateUserId } from '@/lib/api';

type Config = {
  apiKey: string;
  botId: string;
  userId: string;
  conversationId?: string;
};

interface ConfigFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfigSaved: (config: Config) => void;
  initialConfig?: Config;
}

export default function ConfigForm({
  open,
  onOpenChange,
  onConfigSaved,
  initialConfig,
}: ConfigFormProps) {
  const [formData, setFormData] = useState({
    apiKey: '',
    botId: '7488239999658639372', // 預設智能體 ID
    conversationId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set initial values if provided
  useEffect(() => {
    if (initialConfig) {
      setFormData({
        apiKey: initialConfig.apiKey || '',
        botId: initialConfig.botId || '7488239999658639372', // 如果 initialConfig 沒有提供，使用預設值
        conversationId: initialConfig.conversationId || '',
      });
    }
  }, [initialConfig, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (!formData.apiKey || !formData.botId) {
        setError('API 密钥和智能体 ID 是必填项');
        setIsLoading(false);
        return;
      }

      // Use existing userId or generate a new one
      const userId = initialConfig?.userId || generateUserId();

      // Create config object with optional conversationId
      const newConfig: Config = {
        apiKey: formData.apiKey,
        botId: formData.botId,
        userId,
        // 保留现有的conversationId（如果有）
        conversationId: formData.conversationId,
      };

      onConfigSaved(newConfig);
      onOpenChange(false);
    } catch (err) {
      setError('发生意外错误');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95%] sm:max-w-[425px] rounded-md">
        <DialogHeader>
          <DialogTitle>扣子 API 配置</DialogTitle>
          <DialogDescription>输入您的扣子 API 凭据以开始聊天</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">API 密钥</Label>
            <Input
              id="apiKey"
              type="text"
              value={formData.apiKey}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, apiKey: e.target.value }))
              }
              placeholder="pat_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="botId">智能体 ID</Label>
            <Input
              id="botId"
              value={formData.botId}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, botId: e.target.value }))
              }
              placeholder="7488239999658639372"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="conversationId">会话 ID（可选）</Label>
            <Input
              id="conversationId"
              value={formData.conversationId || ''}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  conversationId: e.target.value,
                }))
              }
              placeholder="输入会话 ID 以继续特定对话"
            />
          </div>

          {error && (
            <div className="bg-red-50 p-3 rounded-md flex items-start gap-2 text-red-700 text-sm">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <DialogFooter>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? '保存中...' : '保存配置'}
            </Button>
          </DialogFooter>
        </form>

        <p className="text-xs text-gray-400 mt-2">
          您可以在扣子平台的智能体 URL 中找到智能体 ID。API
          密钥可以在扣子开发者门户中生成。请务必确定开启了 Bot
          管理、会话管理、对话、消息等权限。
        </p>
      </DialogContent>
    </Dialog>
  );
}
