// Achievements and leveling system
const AchievementsSystem = {
  // Get all plant types
  PLANTS: ['cactus', 'bonsai', 'orchid', 'bamboo'],
  
  // Initialize storage if needed
  init() {
    if (!localStorage.getItem('totalPlantsGrown')) {
      localStorage.setItem('totalPlantsGrown', '0');
    }
    if (!localStorage.getItem('currentLevel')) {
      localStorage.setItem('currentLevel', '1');
    }
    if (!localStorage.getItem('plantsByType')) {
      localStorage.setItem('plantsByType', JSON.stringify({
        cactus: 0,
        bonsai: 0,
        orchid: 0,
        bamboo: 0
      }));
    }
    if (!localStorage.getItem('achievements')) {
      localStorage.setItem('achievements', JSON.stringify([]));
    }
  },
  
  // Get total plants grown
  getTotalPlantsGrown() {
    return parseInt(localStorage.getItem('totalPlantsGrown') || '0', 10);
  },
  
  // Get current level
  getCurrentLevel() {
    return parseInt(localStorage.getItem('currentLevel') || '1', 10);
  },
  
  // Calculate level from total plants (level 1 = 1 plant, level 2 = 2 plants, etc.)
  calculateLevel(totalPlants) {
    return Math.max(1, totalPlants);
  },
  
  // Get plants grown by type
  getPlantsByType() {
    return JSON.parse(localStorage.getItem('plantsByType') || '{"cactus":0,"bonsai":0,"orchid":0,"bamboo":0}');
  },
  
  // Record a fully grown plant
  recordPlantGrown(plantType) {
    // Increment total
    const total = this.getTotalPlantsGrown() + 1;
    localStorage.setItem('totalPlantsGrown', total.toString());
    
    // Update by type
    const byType = this.getPlantsByType();
    byType[plantType] = (byType[plantType] || 0) + 1;
    localStorage.setItem('plantsByType', JSON.stringify(byType));
    
    // Update level
    const newLevel = this.calculateLevel(total);
    const currentLevel = this.getCurrentLevel();
    if (newLevel > currentLevel) {
      localStorage.setItem('currentLevel', newLevel.toString());
    }
    
    // Check for achievements
    this.checkAchievements(total, byType);
    
    return {
      totalPlants: total,
      level: this.calculateLevel(total),
      leveledUp: newLevel > currentLevel
    };
  },
  
  // Get all achievements
  getAchievements() {
    return JSON.parse(localStorage.getItem('achievements') || '[]');
  },
  
  // Check if achievement is unlocked
  hasAchievement(achievementId) {
    const achievements = this.getAchievements();
    return achievements.includes(achievementId);
  },
  
  // Unlock an achievement
  unlockAchievement(achievementId) {
    const achievements = this.getAchievements();
    if (!achievements.includes(achievementId)) {
      achievements.push(achievementId);
      localStorage.setItem('achievements', JSON.stringify(achievements));
      return true; // Newly unlocked
    }
    return false; // Already unlocked
  },
  
  // Check for achievements based on progress
  checkAchievements(totalPlants, plantsByType) {
    // First Plant - Grow your first plant
    if (totalPlants === 1 && !this.hasAchievement('first_plant')) {
      this.unlockAchievement('first_plant');
      this.showAchievementNotification('First Plant', 'You grew your first plant! 🌱');
    }
    
    // Level Up achievements
    if (totalPlants === 5 && !this.hasAchievement('level_5')) {
      this.unlockAchievement('level_5');
      this.showAchievementNotification('Level 5!', 'You reached level 5! 🌿');
    }
    if (totalPlants === 10 && !this.hasAchievement('level_10')) {
      this.unlockAchievement('level_10');
      this.showAchievementNotification('Level 10!', 'You reached level 10! 🌳');
    }
    if (totalPlants === 25 && !this.hasAchievement('level_25')) {
      this.unlockAchievement('level_25');
      this.showAchievementNotification('Level 25!', 'You reached level 25! 🏆');
    }
    if (totalPlants === 50 && !this.hasAchievement('level_50')) {
      this.unlockAchievement('level_50');
      this.showAchievementNotification('Level 50!', 'You reached level 50! 🌲');
    }
    if (totalPlants === 100 && !this.hasAchievement('level_100')) {
      this.unlockAchievement('level_100');
      this.showAchievementNotification('Century!', 'You reached level 100! 🌴');
    }
    
    // Plant Variety - Grow all 4 types
    const hasAllTypes = Object.values(plantsByType).every(count => count > 0);
    if (hasAllTypes && !this.hasAchievement('variety')) {
      this.unlockAchievement('variety');
      this.showAchievementNotification('Plant Variety', 'You grew all plant types! 🌸');
    }
    
    // Specialist achievements - Grow 10 of one type
    for (const [plantType, count] of Object.entries(plantsByType)) {
      if (count >= 10 && !this.hasAchievement(`${plantType}_specialist`)) {
        this.unlockAchievement(`${plantType}_specialist`);
        const capitalized = plantType.charAt(0).toUpperCase() + plantType.slice(1);
        this.showAchievementNotification(`${capitalized} Specialist`, `You grew 10 ${plantType} plants! 🌵`);
      }
    }
    
    // Milestone achievements
    if (totalPlants === 25 && !this.hasAchievement('quarter_century')) {
      this.unlockAchievement('quarter_century');
      this.showAchievementNotification('Quarter Century', '25 plants grown! 🌿');
    }
    if (totalPlants === 50 && !this.hasAchievement('half_century')) {
      this.unlockAchievement('half_century');
      this.showAchievementNotification('Half Century', '50 plants grown! 🌳');
    }
  },
  
  // Show achievement notification
  showAchievementNotification(title, message) {
    // Try to show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification(`Achievement Unlocked: ${title}`, {
        body: message,
        icon: 'icon.png'
      });
    }
  },
  
  // Get achievement definitions for display
  getAchievementDefinitions() {
    return [
      {
        id: 'first_plant',
        name: 'First Plant',
        description: 'Grow your first plant',
        icon: '🌱'
      },
      {
        id: 'level_5',
        name: 'Level 5',
        description: 'Reach level 5 (5 plants grown)',
        icon: '🌿'
      },
      {
        id: 'level_10',
        name: 'Level 10',
        description: 'Reach level 10 (10 plants grown)',
        icon: '🌳'
      },
      {
        id: 'level_25',
        name: 'Level 25',
        description: 'Reach level 25 (25 plants grown)',
        icon: '🏆'
      },
      {
        id: 'level_50',
        name: 'Level 50',
        description: 'Reach level 50 (50 plants grown)',
        icon: '🌲'
      },
      {
        id: 'level_100',
        name: 'Century',
        description: 'Reach level 100 (100 plants grown)',
        icon: '🌴'
      },
      {
        id: 'variety',
        name: 'Plant Variety',
        description: 'Grow at least one of each plant type',
        icon: '🌸'
      },
      {
        id: 'cactus_specialist',
        name: 'Cactus Specialist',
        description: 'Grow 10 cactus plants',
        icon: '🌵'
      },
      {
        id: 'bonsai_specialist',
        name: 'Bonsai Specialist',
        description: 'Grow 10 bonsai plants',
        icon: '🌲'
      },
      {
        id: 'orchid_specialist',
        name: 'Orchid Specialist',
        description: 'Grow 10 orchid plants',
        icon: '🌺'
      },
      {
        id: 'bamboo_specialist',
        name: 'Bamboo Specialist',
        description: 'Grow 10 bamboo plants',
        icon: '🎋'
      },
      {
        id: 'quarter_century',
        name: 'Quarter Century',
        description: 'Grow 25 plants total',
        icon: '🌿'
      },
      {
        id: 'half_century',
        name: 'Half Century',
        description: 'Grow 50 plants total',
        icon: '🌳'
      }
    ];
  }
};

// Initialize on load
if (typeof window !== 'undefined') {
  AchievementsSystem.init();
  window.AchievementsSystem = AchievementsSystem;
}

// Export for Node.js environments if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AchievementsSystem;
}
