/**
 * NAVBODH - Shared Frontend API Wrapper
 * 
 * Provides unified HTTP client methods for all frontend components.
 * Automatically manages JSON serialization, credential cookies, and error unboxing.
 */

(function (window) {
  'use strict';

  class ApiError extends Error {
    constructor(code, message, status, raw) {
      super(message);
      this.name = 'ApiError';
      this.code = code || 'UNKNOWN_ERROR';
      this.status = status || 500;
      this.raw = raw;
    }
  }

  async function request(url, options = {}) {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers
      },
      credentials: options.credentials || 'same-origin'
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    let response;
    try {
      response = await fetch(url, config);
    } catch (networkErr) {
      throw new ApiError(
        'NETWORK_ERROR',
        'Could not connect to NAVBODH server. Please check your network connection.',
        0,
        networkErr
      );
    }

    let payload;
    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      try {
        payload = await response.json();
      } catch (parseErr) {
        throw new ApiError('INVALID_JSON', 'Malformed JSON response from server.', response.status);
      }
    } else {
      const text = await response.text();
      if (!response.ok) {
        throw new ApiError('HTTP_ERROR', `Request failed with status ${response.status}: ${text}`, response.status);
      }
      return text;
    }

    // Process NAVBODH Standard Response Format: { success: boolean, data?: any, error?: { code, message } }
    if (payload && payload.success === true) {
      return payload.data;
    }

    // Handle standard error payload
    if (payload && payload.error) {
      throw new ApiError(
        payload.error.code || 'API_ERROR',
        payload.error.message || 'An unknown error occurred.',
        response.status,
        payload
      );
    }

    if (!response.ok) {
      throw new ApiError('HTTP_ERROR', `Request returned status ${response.status}`, response.status, payload);
    }

    return payload;
  }

  const API = {
    get(url, headers = {}) {
      return request(url, { method: 'GET', headers });
    },

    post(url, data = {}, headers = {}) {
      return request(url, { method: 'POST', body: data, headers });
    },

    patch(url, data = {}, headers = {}) {
      return request(url, { method: 'PATCH', body: data, headers });
    },

    delete(url, headers = {}) {
      return request(url, { method: 'DELETE', headers });
    },

    // Auth Shortcuts
    auth: {
      login(identifier, password) {
        return API.post('/api/auth/login', { identifier, password });
      },
      logout() {
        return API.post('/api/auth/logout', {});
      },
      me() {
        return API.get('/api/auth/me');
      }
    },

    // Core Shortcuts
    health() {
      return API.get('/api/health');
    },
    getDepartments() {
      return API.get('/api/departments');
    },
    getCompetencies() {
      return API.get('/api/competencies');
    },
    getProfile() {
      return API.get('/api/profile');
    },
    updateProfile(profileData) {
      return API.patch('/api/profile', profileData);
    },
    getAssessment() {
      return API.get('/api/assessment');
    },
    submitAssessment(assessmentId, answersMap) {
      return API.post('/api/assessment/submit', {
        assessment_id: assessmentId,
        answers: answersMap
      });
    },
    getAssessmentResult() {
      return API.get('/api/assessment/result');
    },

    // Intelligence Shortcuts (Stage 2: Owner Rucha)
    intelligence: {
      getSkillGaps() {
        return API.get('/api/intelligence/skill-gaps');
      },
      getRecommendations() {
        return API.get('/api/intelligence/recommendations');
      },
      getRoadmap() {
        return API.get('/api/intelligence/roadmap');
      },
      askStudyAssistant(message) {
        return API.post('/api/intelligence/study-assistant', { message });
      }
    },

    // Learning Shortcuts (Stage 3: Owner Pathika)
    learning: {
      getCourses() {
        return API.get('/api/courses');
      },
      getCourse(id) {
        return API.get(`/api/courses/${id}`);
      },
      getCourseLessons(id) {
        return API.get(`/api/courses/${id}/lessons`);
      },
      getLesson(id) {
        return API.get(`/api/lessons/${id}`);
      },
      completeLesson(id) {
        return API.post(`/api/lessons/${id}/complete`, {});
      },
      getQuizzes() {
        return API.get('/api/quizzes');
      },
      getQuiz(id) {
        return API.get(`/api/quizzes/${id}`);
      },
      submitQuiz(id, answers) {
        return API.post(`/api/quizzes/${id}/submit`, { answers });
      }
    },

    // Gamification Shortcuts (Stage 4: Owner Pallav)
    gamification: {
      getOverview() {
        return API.get('/api/gamification');
      },
      getRewards() {
        return API.get('/api/gamification/rewards');
      },
      getLeaderboard() {
        return API.get('/api/gamification/leaderboard');
      },
      getAchievements() {
        return API.get('/api/gamification/achievements');
      }
    },

    // Admin Shortcuts
    admin: {
      getOverview() {
        return API.get('/api/admin/overview');
      }
    }
  };

  window.API = API;
  window.ApiError = ApiError;
})(window);
