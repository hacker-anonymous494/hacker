import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

let sessionId = null;
let pageStartTime = null;
let currentPage = null;

const getSessionId = () => {
  if (!sessionId) {
    sessionId = localStorage.getItem('trifilia_session_id');
    if (!sessionId) {
      sessionId = crypto.randomUUID();
      localStorage.setItem('trifilia_session_id', sessionId);
    }
  }
  return sessionId;
};

const logEvent = async (eventType, data = {}) => {
  try {
    await supabase.from('analytics_events').insert([{
      session_id: getSessionId(),
      event_type: eventType,
      page_path: window.location.pathname,
      user_agent: navigator.userAgent,
      referrer: document.referrer,
      ...data,
    }]);
  } catch (err) {
    console.warn('Analytics log failed', err);
  }
};

export const useAnalytics = () => {
  const location = useLocation();
  const scrollTimeout = useRef(null);

  // Page view & time tracking
  useEffect(() => {
    const path = location.pathname;
    if (currentPage !== path) {
      // Log exit from previous page
      if (currentPage && pageStartTime) {
        const duration = Date.now() - pageStartTime;
        logEvent('time_on_page', { page_path: currentPage, duration_ms: duration });
      }
      // Start new page
      currentPage = path;
      pageStartTime = Date.now();
      logEvent('page_view', { page_path: path });
    }
  }, [location]);

  // Scroll depth tracking
  useEffect(() => {
    const handleScroll = () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        const scrollPercent = Math.floor((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
        if (scrollPercent > 0) {
          logEvent('scroll_depth', { scroll_percentage: scrollPercent });
        }
      }, 500);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Exit tracking using sendBeacon (reliable)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentPage && pageStartTime) {
        const duration = Date.now() - pageStartTime;
        navigator.sendBeacon(
          '/.netlify/functions/log-analytics',
          JSON.stringify({
            session_id: getSessionId(),
            event_type: 'exit',
            page_path: currentPage,
            duration_ms: duration,
          })
        );
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);
};

// Security logging helper (frontend)
export const logSecurityEvent = async (eventType, details = {}) => {
  try {
    await supabase.from('security_events').insert([{
      event_type: eventType,
      user_agent: navigator.userAgent,
      details,
    }]);
  } catch (err) {
    console.warn('Security log failed', err);
  }
};
