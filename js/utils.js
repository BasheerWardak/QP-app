// Utility Functions for Super Scheduler

class DateUtils {
  static isToday(date) {
    const today = new Date();
    return date.getDate() === today.getDate() && 
           date.getMonth() === today.getMonth() && 
           date.getFullYear() === today.getFullYear();
  }
  
  static formatDate(date) {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    // Make sure it's valid
    if (!(date instanceof Date) || isNaN(date)) return '';
    return date.toISOString().split('T')[0];
  }
  
  static formatDateTime(date) {
    if (typeof date === 'string') date = new Date(date);
    if (!(date instanceof Date) || isNaN(date)) return '';
    return date.toLocaleString();
  }
  
  static getTaskStatus(task) {
    if (task.status === 'completed') return 'completed';
    const today = new Date();
    const dueDate = new Date(task.dueDate);
    if (isNaN(dueDate)) return 'pending';
    // normalize to start of day comparison
    const dueStart = new Date(dueDate);
    dueStart.setHours(0,0,0,0);
    const todayStart = new Date(today);
    todayStart.setHours(0,0,0,0);
    if (dueStart < todayStart) return 'overdue';
    return 'pending';
  }

  // Normalize a Date to the start of the day (local)
  static normalizeToStartOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  /**
   * getEventRange(event)
   * Returns { start: Date, end: Date } for the provided event object.
   * - Supports events with:
   *    event.date + event.time
   *    optional event.endDate + event.endTime
   *    or optional event.endTime (same day)
   * - Falls back to a default duration of 1 hour when no end is specified.
   */
  static getEventRange(event) {
    if (!event) return { start: null, end: null };

    // Helper to safely build Date from date + time (or just date)
    function buildDate(dateStr, timeStr) {
      if (!dateStr && !timeStr) return null;
      if (!timeStr && dateStr && dateStr.length === 10) {
        // date-only string -> local midnight
        return new Date(dateStr + 'T00:00:00');
      }
      // If date present and time present, use ISO-like local string
      if (dateStr && timeStr) {
        // ensure time has seconds if not present
        const time = timeStr.length === 5 ? timeStr + ':00' : timeStr;
        return new Date(`${dateStr}T${time}`);
      }
      // If only time provided (rare), assume today
      if (!dateStr && timeStr) {
        const today = new Date();
        const time = timeStr.length === 5 ? timeStr + ':00' : timeStr;
        const isoDate = DateUtils.formatDate(today);
        return new Date(`${isoDate}T${time}`);
      }
      // Else try Date constructor
      return new Date(dateStr || timeStr);
    }

    const start = buildDate(event.date, event.time) || buildDate(event.startDate, event.startTime);
    let end = null;

    // Prefer explicit endDate+endTime
    if (event.endDate && event.endTime) {
      end = buildDate(event.endDate, event.endTime);
    } else if (event.endTime && event.endDate === undefined && event.date) {
      // if only endTime given, assume same date as start
      end = buildDate(event.date, event.endTime);
    } else if (event.endDate && !event.endTime) {
      // If endDate given without time, set to end of that day
      end = new Date(event.endDate + 'T23:59:59');
    } else if (event.endTime && !event.date && !event.startDate) {
      // improbable; try to set end same-day as start
      end = buildDate(event.date, event.endTime);
    }

    // Fallback: if no explicit end, assume 1 hour duration from start
    if (!end && start) {
      end = new Date(start.getTime() + (60 * 60 * 1000)); // +1 hour default
    }

    return { start, end };
  }
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

function getCategoryColor(category) {
  const colors = {
    work: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-500',
      dot: 'bg-blue-500'
    },
    personal: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-500',
      dot: 'bg-green-500'
    },
    health: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-500',
      dot: 'bg-red-500'
    },
    social: {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      border: 'border-purple-500',
      dot: 'bg-purple-500'
    },
    default: {
      bg: 'bg-slate-100',
      text: 'text-slate-800',
      border: 'border-slate-300',
      dot: 'bg-slate-500'
    }
  };
  return colors[category] || colors.default;
}

function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  const toastMessage = document.getElementById('toastMessage');
  const toastIcon = document.getElementById('toastIcon');
  
  if (!toast || !toastMessage || !toastIcon) return;
  
  toastMessage.textContent = message;
  
  // Set icon and color based on type
  let iconClass = 'fa-check-circle text-success';
  switch(type) {
    case 'error':
      iconClass = 'fa-times-circle text-error';
      break;
    case 'info':
      iconClass = 'fa-info-circle text-primary';
      break;
    case 'warning':
      iconClass = 'fa-exclamation-triangle text-warning';
      break;
  }
  
  toastIcon.className = `fas ${iconClass}`;
  toast.classList.remove('translate-x-full');
  toast.classList.add('show');
  
  setTimeout(() => {
    hideToast();
  }, 3000);
}

function hideToast() {
  const toast = document.getElementById('toast');
  if (toast) {
    toast.classList.remove('show');
    toast.classList.add('translate-x-full');
  }
}

function applyTheme(theme) {
  // Apply theme to document
  if (theme === 'dark') {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  }
  
  // Save to data attribute for reference
  document.body.dataset.theme = theme;
}

// Theme initialization
document.addEventListener('DOMContentLoaded', async function() {
  try {
    await db.init();
    
    // Get theme setting
    const theme = await db.getSetting('theme') || 'light';
    applyTheme(theme);
    
    // Listen for theme changes
    document.addEventListener('themeChanged', async function() {
      const newTheme = await db.getSetting('theme') || 'light';
      applyTheme(newTheme);
    });
  } catch (error) {
    console.error('Error initializing theme:', error);
    // Fallback to localStorage
    const theme = localStorage.getItem('theme') || 'light';
    applyTheme(theme);
  }
});

// Export utility functions
window.DateUtils = DateUtils;
window.generateId = generateId;
window.getCategoryColor = getCategoryColor;
window.showToast = showToast;
window.hideToast = hideToast;
window.applyTheme = applyTheme;
