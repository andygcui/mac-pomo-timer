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
    if (!localStorage.getItem('dailyActivity')) {
      localStorage.setItem('dailyActivity', JSON.stringify({}));
    }
    if (!localStorage.getItem('currentStreak')) {
      localStorage.setItem('currentStreak', '0');
    }
    if (!localStorage.getItem('lastActivityDate')) {
      localStorage.setItem('lastActivityDate', '');
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
  
  // Calculate level from total plants
  // Level 1: need 1 plant (0->1 total)
  // Level 2: need 2 MORE plants (1->3 total)  
  // Level 3: need 3 MORE plants (3->6 total)
  // Level 4: need 4 MORE plants (6->10 total)
  // Level n: need n MORE plants
  calculateLevel(totalPlants) {
    if (totalPlants === 0) return 1;
    if (totalPlants === 1) return 2;
    
    // After level 2, each level needs progressively more plants
    // Level 3 starts at 3 total plants (1+2)
    // Level 4 starts at 6 total plants (1+2+3)
    // Level 5 starts at 10 total plants (1+2+3+4)
    let level = 2;
    let requiredPlants = 3; // Level 3 requires 3 total plants
    
    while (totalPlants >= requiredPlants) {
      level++;
      requiredPlants += level; // Add plants needed for next level
    }
    
    return level;
  },
  
  // Get level progress
  getLevelProgress() {
    const total = this.getTotalPlantsGrown();
    const currentLevel = this.calculateLevel(total);
    
    // Calculate how many plants are needed to START the current level
    let plantsNeededForLevel = 0;
    for (let i = 1; i < currentLevel; i++) {
      plantsNeededForLevel += i;
    }
    
    // How many plants beyond the start of the current level
    const plantsInCurrentLevel = total - plantsNeededForLevel;
    
    // How many plants are needed to COMPLETE the current level
    const plantsNeededToComplete = currentLevel;
    
    // Progress within current level
    const progress = plantsNeededToComplete === 0 ? 0 : plantsInCurrentLevel / plantsNeededToComplete;
    
    return {
      currentLevel: currentLevel,
      plantsGrown: total,
      plantsNeeded: plantsNeededToComplete,
      progress: Math.min(progress, 1.0),
      nextLevelPlants: plantsNeededToComplete - plantsInCurrentLevel
    };
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
    
    // Record daily activity
    this.recordDailyActivity();
    
    return {
      totalPlants: total,
      level: this.calculateLevel(total),
      leveledUp: newLevel > currentLevel
    };
  },
  
  // Record activity for today
  recordDailyActivity() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const activity = JSON.parse(localStorage.getItem('dailyActivity') || '{}');
    
    // Increment count for today
    activity[today] = (activity[today] || 0) + 1;
    localStorage.setItem('dailyActivity', JSON.stringify(activity));
    
    // Update streak
    this.updateStreak(today);
  },
  
  // Update streak based on activity
  updateStreak(today) {
    const lastActivityDate = localStorage.getItem('lastActivityDate');
    let currentStreak = parseInt(localStorage.getItem('currentStreak') || '0', 10);
    
    if (lastActivityDate === '') {
      // First time - start streak at 1
      currentStreak = 1;
    } else {
      const lastDate = new Date(lastActivityDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff === 0) {
        // Same day - streak continues
        // Don't increment, just maintain
      } else if (daysDiff === 1) {
        // Consecutive day - increment streak
        currentStreak += 1;
      } else {
        // Streak broken - reset to 1
        currentStreak = 1;
      }
    }
    
    localStorage.setItem('currentStreak', currentStreak.toString());
    localStorage.setItem('lastActivityDate', today);
  },
  
  // Get current streak
  getStreak() {
    const currentStreak = parseInt(localStorage.getItem('currentStreak') || '0', 10);
    const lastActivityDate = localStorage.getItem('lastActivityDate');
    const today = new Date().toISOString().split('T')[0];
    
    // Check if streak is still valid (not broken by missing today)
    if (lastActivityDate !== today) {
      const lastDate = new Date(lastActivityDate);
      const todayDate = new Date(today);
      const daysDiff = Math.floor((todayDate - lastDate) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 1) {
        // Streak broken - reset
        localStorage.setItem('currentStreak', '0');
        return 0;
      }
    }
    
    return currentStreak;
  },
  
  // Get activity data for heat map (last 140 days = 20 weeks)
  getActivityHeatMap() {
    const activity = JSON.parse(localStorage.getItem('dailyActivity') || '{}');
    const today = new Date();
    const heatMap = [];
    
    // Get last 140 days (20 weeks)
    for (let i = 139; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      const count = activity[dateStr] || 0;
      
      heatMap.push({
        date: dateStr,
        count: count
      });
    }
    
    return heatMap;
  },
  
  // Check for time-based achievements (when starting a focus session)
  checkTimeBasedAchievements() {
    const now = new Date();
    const hour = now.getHours();
    
    // Midnight Bloom - Start focus after 10pm (22:00-23:59)
    if (hour >= 22 && !this.hasAchievement('moonlight_gardener')) {
      this.unlockAchievement('moonlight_gardener');
      this.showAchievementNotification('Midnight Bloom', 'You started a focus session after 10pm! 🌙');
    }
    
    // Early Bird - Start focus before 6am (0:00-5:59)
    if (hour < 6 && !this.hasAchievement('early_bird')) {
      this.unlockAchievement('early_bird');
      this.showAchievementNotification('Early Bird', 'You started a focus session before 6am! 🌅');
    }
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
      this.showAchievementNotification('Garden Newb', 'You grew your first plant! 🌱');
    }
    
    // Level Up achievements
    if (totalPlants === 10 && !this.hasAchievement('level_5')) {
      this.unlockAchievement('level_5');
      this.showAchievementNotification('Green Thumb', 'You grew 10 plants! 🌿');
    }
    if (totalPlants === 25 && !this.hasAchievement('level_25')) {
      this.unlockAchievement('level_25');
      this.showAchievementNotification('Garden Guru', 'You grew 25 plants! 🏆');
    }
    if (totalPlants === 50 && !this.hasAchievement('level_50')) {
      this.unlockAchievement('level_50');
      this.showAchievementNotification('Botanical Boss', 'You grew 50 plants! 🌲');
    }
    if (totalPlants === 100 && !this.hasAchievement('level_100')) {
      this.unlockAchievement('level_100');
      this.showAchievementNotification('Plant Whisperer', 'You grew 100 plants! 🌴');
    }
    
    // Plant Variety - Grow all 4 types
    const hasAllTypes = Object.values(plantsByType).every(count => count > 0);
    if (hasAllTypes && !this.hasAchievement('variety')) {
      this.unlockAchievement('variety');
      this.showAchievementNotification('Plant Collector', 'You grew all plant types! 🌸');
    }
    
    // Specialist achievements - Grow 10 of one type
    for (const [plantType, count] of Object.entries(plantsByType)) {
      if (count >= 10 && !this.hasAchievement(`${plantType}_specialist`)) {
        this.unlockAchievement(`${plantType}_specialist`);
        const capitalized = plantType.charAt(0).toUpperCase() + plantType.slice(1);
        this.showAchievementNotification(`${capitalized} Specialist`, `You grew 10 ${plantType} plants! 🌵`);
      }
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
        name: 'Garden Newb',
        description: 'Grow your first plant!',
        icon: '^-^'
      },
      {
        id: 'level_5',
        name: 'Green Thumb',
        description: 'Grow 10 plants!',
        icon: '^-^'
      },
      {
        id: 'level_25',
        name: 'Garden Guru',
        description: 'Grow 25 plants!',
        icon: '^-^'
      },
      {
        id: 'level_50',
        name: 'Botanical Boss',
        description: 'Grow 50 plants!',
        icon: '^-^'
      },
      {
        id: 'level_100',
        name: 'Plant Whisperer',
        description: 'Grow 100 plants!',
        icon: '^-^'
      },
      {
        id: 'variety',
        name: 'Plant Collector',
        description: 'Grow at least one of each plant type!',
        icon: '^-^'
      },
      {
        id: 'cactus_specialist',
        name: 'Cactus Specialist',
        description: 'Grow 10 cactus plants!',
        icon: '^-^'
      },
      {
        id: 'bonsai_specialist',
        name: 'Bonsai Specialist',
        description: 'Grow 10 bonsai plants!',
        icon: '^-^'
      },
      {
        id: 'orchid_specialist',
        name: 'Orchid Specialist',
        description: 'Grow 10 orchid plants!',
        icon: '^-^'
      },
      {
        id: 'bamboo_specialist',
        name: 'Bamboo Specialist',
        description: 'Grow 10 bamboo plants!',
        icon: '^-^'
      },
      {
        id: 'moonlight_gardener',
        name: 'Midnight Bloom',
        description: 'Start a focus session after 10pm!',
        icon: '^-^'
      },
      {
        id: 'early_bird',
        name: 'Early Bird',
        description: 'Start a focus session before 6am!',
        icon: '^-^'
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
