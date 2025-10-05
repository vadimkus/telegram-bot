const { PrismaClient } = require('@prisma/client');

// Initialize Prisma client
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

class DatabaseService {
  // User operations
  async createOrUpdateUser(telegramUser) {
    try {
      const user = await prisma.user.upsert({
        where: { telegramId: BigInt(telegramUser.id) },
        update: {
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          languageCode: telegramUser.language_code,
          isBot: telegramUser.is_bot || false,
          isPremium: telegramUser.is_premium || false,
          lastSeen: new Date(),
        },
        create: {
          telegramId: BigInt(telegramUser.id),
          username: telegramUser.username,
          firstName: telegramUser.first_name,
          lastName: telegramUser.last_name,
          languageCode: telegramUser.language_code,
          isBot: telegramUser.is_bot || false,
          isPremium: telegramUser.is_premium || false,
          lastSeen: new Date(),
        },
      });
      return user;
    } catch (error) {
      console.error('Error creating/updating user:', error);
      throw error;
    }
  }

  async getUserByTelegramId(telegramId) {
    try {
      return await prisma.user.findUnique({
        where: { telegramId: BigInt(telegramId) },
      });
    } catch (error) {
      console.error('Error getting user:', error);
      throw error;
    }
  }

  async getAllUsers() {
    try {
      return await prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  }

  async updateUserStatus(telegramId, isActive, isBlocked = false) {
    try {
      return await prisma.user.update({
        where: { telegramId: BigInt(telegramId) },
        data: {
          isActive,
          isBlocked,
          lastSeen: new Date(),
        },
      });
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  }

  // Message operations
  async createMessage(messageData) {
    try {
      return await prisma.message.create({
        data: {
          messageId: BigInt(messageData.messageId),
          text: messageData.text,
          messageType: messageData.messageType || 'text',
          userId: messageData.userId,
          sessionId: messageData.sessionId,
        },
      });
    } catch (error) {
      console.error('Error creating message:', error);
      throw error;
    }
  }

  async getUserMessages(userId, limit = 50) {
    try {
      return await prisma.message.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: true,
          session: true,
        },
      });
    } catch (error) {
      console.error('Error getting user messages:', error);
      throw error;
    }
  }

  // Session operations
  async createSession(userId) {
    try {
      return await prisma.session.create({
        data: {
          userId,
          isActive: true,
          startedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async endSession(sessionId) {
    try {
      return await prisma.session.update({
        where: { id: sessionId },
        data: {
          isActive: false,
          endedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  async getActiveSession(userId) {
    try {
      return await prisma.session.findFirst({
        where: {
          userId,
          isActive: true,
        },
        orderBy: { startedAt: 'desc' },
      });
    } catch (error) {
      console.error('Error getting active session:', error);
      throw error;
    }
  }

  // Analytics operations
  async trackEvent(event, data = null, userId = null) {
    try {
      return await prisma.analytics.create({
        data: {
          event,
          data,
          userId,
        },
      });
    } catch (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
  }

  async getAnalytics(event = null, limit = 100) {
    try {
      const where = event ? { event } : {};
      return await prisma.analytics.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        include: {
          user: true,
        },
      });
    } catch (error) {
      console.error('Error getting analytics:', error);
      throw error;
    }
  }

  // Bot settings operations
  async getSetting(key) {
    try {
      const setting = await prisma.botSettings.findUnique({
        where: { key },
      });
      return setting ? setting.value : null;
    } catch (error) {
      console.error('Error getting setting:', error);
      throw error;
    }
  }

  async setSetting(key, value, description = null) {
    try {
      return await prisma.botSettings.upsert({
        where: { key },
        update: { value, description },
        create: { key, value, description },
      });
    } catch (error) {
      console.error('Error setting setting:', error);
      throw error;
    }
  }

  // Statistics
  async getStats() {
    try {
      const [
        totalUsers,
        activeUsers,
        totalMessages,
        totalSessions,
        recentUsers,
      ] = await Promise.all([
        prisma.user.count(),
        prisma.user.count({ where: { isActive: true } }),
        prisma.message.count(),
        prisma.session.count(),
        prisma.user.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        }),
      ]);

      return {
        totalUsers,
        activeUsers,
        totalMessages,
        totalSessions,
        recentUsers,
      };
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  // Cleanup operations
  async cleanup() {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

module.exports = new DatabaseService();
