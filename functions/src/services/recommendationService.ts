import { db } from '../config/firebase';
import { FieldValue } from 'firebase-admin/firestore';

export interface UserProfile {
  id: string;
  telegramId: string;
  displayName: string;
  bio?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  orientation?: string;
  age?: number;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
}

export interface DiscoverySettings {
  minAge: number;
  maxAge: number;
  maxDistance: number;
  interestedInGender: string[];
  interestedInRoles: string[];
  lookingForFriends: boolean;
  lookingForRomance: boolean;
  lookingForPoly: boolean;
}

export interface RecommendationFilter {
  userId: string;
  limit?: number;
  excludeBlocked?: boolean;
  excludeAlreadyLiked?: boolean;
  excludeMatches?: boolean;
}

export interface RecommendationResult {
  user: UserProfile;
  score: number;
  distance?: number;
  commonInterests?: string[];
  compatibilityScore: number;
}

export class RecommendationService {
  private static instance: RecommendationService;

  static getInstance(): RecommendationService {
    if (!RecommendationService.instance) {
      RecommendationService.instance = new RecommendationService();
    }
    return RecommendationService.instance;
  }

  /**
   * Calcula la distancia entre dos puntos geográficos usando la fórmula de Haversine
   */
  private calculateDistance(
    lat1: number, 
    lon1: number, 
    lat2: number, 
    lon2: number
  ): number {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  /**
   * Calcula el score de compatibilidad entre dos usuarios
   */
  private calculateCompatibilityScore(
    userProfile: UserProfile,
    targetProfile: UserProfile,
    userSettings: DiscoverySettings,
    targetSettings?: DiscoverySettings
  ): number {
    let score = 0;
    let maxScore = 100;

    // 1. Filtro de orientación (30 puntos)
    if (userSettings.interestedInGender.length > 0) {
      const userInterested = userSettings.interestedInGender.includes(targetProfile.orientation || 'other');
      const targetInterested = targetSettings ? 
        targetSettings.interestedInGender.includes(userProfile.orientation || 'other') : true;
      
      if (userInterested && targetInterested) {
        score += 30;
      } else if (!userInterested || !targetInterested) {
        return 0; // Incompatible
      }
    }

    // 2. Distancia geográfica (25 puntos)
    if (userProfile.latitude && userProfile.longitude && 
        targetProfile.latitude && targetProfile.longitude) {
      const distance = this.calculateDistance(
        userProfile.latitude, userProfile.longitude,
        targetProfile.latitude, targetProfile.longitude
      );
      
      if (distance <= userSettings.maxDistance) {
        // Más cerca = más puntos
        const distanceScore = Math.max(0, 25 - (distance / userSettings.maxDistance) * 25);
        score += distanceScore;
      } else {
        return 0; // Demasiado lejos
      }
    } else {
      // Sin ubicación = 15 puntos base
      score += 15;
    }

    // 3. Intenciones compatibles (20 puntos)
    const userIntentions = [
      userSettings.lookingForFriends,
      userSettings.lookingForRomance,
      userSettings.lookingForPoly
    ];
    
    const targetIntentions = targetSettings ? [
      targetSettings.lookingForFriends,
      targetSettings.lookingForRomance,
      targetSettings.lookingForPoly
    ] : [true, true, true]; // Por defecto, todo vale

    let intentionMatches = 0;
    for (let i = 0; i < 3; i++) {
      if (userIntentions[i] && targetIntentions[i]) {
        intentionMatches++;
      }
    }
    
    score += (intentionMatches / 3) * 20;

    // 4. Rango de edad (15 puntos)
    if (userProfile.age && targetProfile.age) {
      const ageDiff = Math.abs(userProfile.age - targetProfile.age);
      const maxDiff = userSettings.maxAge - userSettings.minAge;
      
      if (ageDiff <= maxDiff * 0.3) { // Dentro del 30% del rango
        score += 15;
      } else if (ageDiff <= maxDiff * 0.6) {
        score += 10;
      } else if (ageDiff <= maxDiff * 0.9) {
        score += 5;
      }
    } else {
      // Sin edad = 10 puntos base
      score += 10;
    }

    // 5. Perfil completo (10 puntos)
    let profileCompleteness = 0;
    if (targetProfile.bio) profileCompleteness += 0.4;
    if (targetProfile.city) profileCompleteness += 0.3;
    if (targetProfile.orientation) profileCompleteness += 0.3;
    
    score += profileCompleteness * 10;

    return Math.min(score, maxScore);
  }

  /**
   * Obtiene los usuarios bloqueados por un usuario
   */
  private async getBlockedUsers(userId: string): Promise<string[]> {
    try {
      const blocksSnapshot = await db.collection('blocks')
        .where('blockerId', '==', userId)
        .get();
      
      return blocksSnapshot.docs.map(doc => doc.data().blockedId);
    } catch (error) {
      console.error('Error obteniendo usuarios bloqueados:', error);
      return [];
    }
  }

  /**
   * Obtiene los usuarios a los que ya les dio like
   */
  private async getLikedUsers(userId: string): Promise<string[]> {
    try {
      const likesSnapshot = await db.collection('likes')
        .where('fromId', '==', userId)
        .get();
      
      return likesSnapshot.docs.map(doc => doc.data().toId);
    } catch (error) {
      console.error('Error obteniendo usuarios likeados:', error);
      return [];
    }
  }

  /**
   * Obtiene los matches existentes de un usuario
   */
  private async getExistingMatches(userId: string): Promise<string[]> {
    try {
      const matchesSnapshot = await db.collection('matches')
        .where('status', '==', 'ACTIVE')
        .get();
      
      const matchedUserIds: string[] = [];
      matchesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.aId === userId) {
          matchedUserIds.push(data.bId);
        } else if (data.bId === userId) {
          matchedUserIds.push(data.aId);
        }
      });
      
      return matchedUserIds;
    } catch (error) {
      console.error('Error obteniendo matches existentes:', error);
      return [];
    }
  }

  /**
   * Obtiene la configuración de descubrimiento de un usuario
   */
  public async getDiscoverySettings(userId: string): Promise<DiscoverySettings | null> {
    try {
      const settingsDoc = await db.collection('discoverySettings').doc(userId).get();
      
      if (!settingsDoc.exists) {
        // Configuración por defecto
        return {
          minAge: 18,
          maxAge: 99,
          maxDistance: 50,
          interestedInGender: [],
          interestedInRoles: [],
          lookingForFriends: true,
          lookingForRomance: true,
          lookingForPoly: true
        };
      }
      
      return settingsDoc.data() as DiscoverySettings;
    } catch (error) {
      console.error('Error obteniendo configuración de descubrimiento:', error);
      return null;
    }
  }

  /**
   * Obtiene el perfil de un usuario
   */
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const userDoc = await db.collection('users').doc(userId).get();
      
      if (!userDoc.exists) {
        return null;
      }
      
      const userData = userDoc.data();
      const profileDoc = await db.collection('profiles').doc(userId).get();
      const profileData = profileDoc.exists ? profileDoc.data() : {};
      
      return {
        id: userId,
        telegramId: userData?.telegramId || '',
        displayName: userData?.displayName || 'Usuario',
        bio: profileData?.bio,
        city: profileData?.city,
        latitude: profileData?.latitude,
        longitude: profileData?.longitude,
        orientation: profileData?.orientation,
        age: profileData?.age,
        role: userData?.role || 'USER'
      };
    } catch (error) {
      console.error('Error obteniendo perfil de usuario:', error);
      return null;
    }
  }

  /**
   * Genera recomendaciones para un usuario basadas en sus preferencias
   */
  async getRecommendations(filter: RecommendationFilter): Promise<RecommendationResult[]> {
    try {
      const { userId, limit = 20, excludeBlocked = true, excludeAlreadyLiked = true, excludeMatches = true } = filter;

      // Obtener perfil y configuración del usuario
      const userProfile = await this.getUserProfile(userId);
      const userSettings = await this.getDiscoverySettings(userId);

      if (!userProfile || !userSettings) {
        throw new Error('Usuario o configuración no encontrados');
      }

      // Obtener listas de exclusión
      const [blockedUsers, likedUsers, existingMatches] = await Promise.all([
        excludeBlocked ? this.getBlockedUsers(userId) : [],
        excludeAlreadyLiked ? this.getLikedUsers(userId) : [],
        excludeMatches ? this.getExistingMatches(userId) : []
      ]);

      const excludedUsers = new Set([...blockedUsers, ...likedUsers, ...existingMatches, userId]);

      // Construir consulta base
      let query = db.collection('users').limit(100); // Límite inicial para procesamiento

      // Aplicar filtros básicos
      const candidates: UserProfile[] = [];
      const snapshot = await query.get();

      for (const doc of snapshot.docs) {
        const candidateId = doc.id;
        
        // Saltar usuarios excluidos
        if (excludedUsers.has(candidateId)) {
          continue;
        }

        // Saltar moderadores y administradores del pool de recomendaciones
        const candidateData = doc.data();
        if (candidateData.role !== 'USER') {
          continue;
        }

        // Obtener perfil completo del candidato
        const candidateProfile = await this.getUserProfile(candidateId);
        if (!candidateProfile) {
          continue;
        }

        candidates.push(candidateProfile);
      }

      // Calcular compatibilidad para cada candidato
      const recommendations: RecommendationResult[] = [];
      
      for (const candidate of candidates) {
        const candidateSettings = await this.getDiscoverySettings(candidate.id);
        const compatibilityScore = this.calculateCompatibilityScore(
          userProfile, candidate, userSettings, candidateSettings || undefined
        );

        if (compatibilityScore > 30) { // Umbral mínimo de compatibilidad
          let distance: number | undefined;
          if (userProfile.latitude && userProfile.longitude && 
              candidate.latitude && candidate.longitude) {
            distance = this.calculateDistance(
              userProfile.latitude, userProfile.longitude,
              candidate.latitude, candidate.longitude
            );
          }

          recommendations.push({
            user: candidate,
            score: compatibilityScore,
            distance,
            compatibilityScore
          });
        }
      }

      // Ordenar por score de compatibilidad
      recommendations.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

      // Limitar resultados
      return recommendations.slice(0, limit);

    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      throw error;
    }
  }

  /**
   * Registra una acción de descubrimiento para análisis
   */
  async logDiscoveryAction(
    userId: string, 
    action: 'view' | 'like' | 'pass' | 'block',
    targetUserId: string,
    score?: number
  ): Promise<void> {
    try {
      await db.collection('discoveryLogs').add({
        userId,
        targetUserId,
        action,
        score,
        timestamp: FieldValue.serverTimestamp()
      });
    } catch (error) {
      console.error('Error registrando acción de descubrimiento:', error);
    }
  }

  /**
   * Obtiene estadísticas de descubrimiento para un usuario
   */
  async getDiscoveryStats(userId: string): Promise<{
    totalViews: number;
    totalLikes: number;
    totalPasses: number;
    totalBlocks: number;
    averageCompatibilityScore: number;
  }> {
    try {
      const logsSnapshot = await db.collection('discoveryLogs')
        .where('userId', '==', userId)
        .get();

      const stats = {
        totalViews: 0,
        totalLikes: 0,
        totalPasses: 0,
        totalBlocks: 0,
        averageCompatibilityScore: 0
      };

      let totalScore = 0;
      let scoreCount = 0;

      logsSnapshot.docs.forEach(doc => {
        const data = doc.data();
        switch (data.action) {
          case 'view':
            stats.totalViews++;
            break;
          case 'like':
            stats.totalLikes++;
            break;
          case 'pass':
            stats.totalPasses++;
            break;
          case 'block':
            stats.totalBlocks++;
            break;
        }

        if (data.score) {
          totalScore += data.score;
          scoreCount++;
        }
      });

      if (scoreCount > 0) {
        stats.averageCompatibilityScore = totalScore / scoreCount;
      }

      return stats;
    } catch (error) {
      console.error('Error obteniendo estadísticas de descubrimiento:', error);
      return {
        totalViews: 0,
        totalLikes: 0,
        totalPasses: 0,
        totalBlocks: 0,
        averageCompatibilityScore: 0
      };
    }
  }
}