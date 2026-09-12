/**
 * Realistic Ad Specifications & Multi-Surface Profiles
 * 
 * Provides production-grade sample specs (Spatial AR Headset, Cyberpunk Sneakers, Gourmet Coffee)
 * and all required Surface Profiles (Mobile Portrait, Mobile Landscape, Broadcast Lower-Third,
 * Square Kiosk, plus an extreme Nano surface).
 */

import { AdSpec, SurfaceProfile } from './types';

// ==========================================
// SAMPLE AD SPECIFICATIONS
// ==========================================

export const PRESET_SPECS: AdSpec[] = [
  {
    id: 'spec-flam-spatial-pro',
    name: 'Flam Prism XR - Spatial Headset',
    metadata: {
      campaignName: 'Q1 Spatial Launch',
      vertical: 'spatial'
    },
    theme: {
      primaryColor: '#6366f1', // Indigo
      accentColor: '#06b6d4',  // Cyan
      backgroundColor: '#090d16',
      backgroundGradient: 'linear-gradient(135deg, #090d16 0%, #0f172a 50%, #1e1b4b 100%)',
      textColor: '#f8fafc',
      mutedTextColor: '#94a3b8',
      glassmorphism: true,
      cornerRadius: 16
    },
    elements: [
      {
        id: 'brand-1',
        role: 'branding',
        priority: 35,
        name: 'FLAM SPATIAL',
        tagline: 'Volumetric Computing',
        dropThreshold: 15
      },
      {
        id: 'badge-1',
        role: 'badge',
        priority: 60,
        text: '⚡ SPATIAL GEN-3',
        colorTheme: 'cyan',
        dropThreshold: 20
      },
      {
        id: 'headline-1',
        role: 'headline',
        priority: 95,
        text: 'Step Inside Next Reality with Flam Prism XR',
        baseFontSize: 28,
        weight: 'extra-bold'
      },
      {
        id: 'subhead-1',
        role: 'subhead',
        priority: 50,
        text: 'Hyper-realistic spatial computing with true volumetric 3D pass-through and neural tracking.',
        baseFontSize: 15,
        dropThreshold: 30
      },
      {
        id: 'media-1',
        role: 'media',
        priority: 85,
        src: 'https://images.unsplash.com/photo-1593508512255-86ab42a8e620?auto=format&fit=crop&w=800&q=80',
        alt: 'Flam Prism XR Holographic Headset',
        fitMode: 'cover',
        accentGlow: 'rgba(99, 102, 241, 0.4)'
      },
      {
        id: 'rating-1',
        role: 'rating',
        priority: 40,
        score: 4.9,
        reviewCount: 3840,
        dropThreshold: 25
      },
      {
        id: 'price-1',
        role: 'price',
        priority: 75,
        currentPrice: '$799',
        originalPrice: '$999',
        discountText: 'Save $200'
      },
      {
        id: 'cta-1',
        role: 'cta',
        priority: 100,
        label: 'Experience in AR',
        variant: 'glow',
        minTapWidth: 44,
        minTapHeight: 44
      },
      {
        id: 'legal-1',
        role: 'legal',
        priority: 15,
        text: '© 2026 FlamAI. Requires compatible WebXR device. Terms apply.',
        dropThreshold: 40
      }
    ]
  },
  {
    id: 'spec-cyberpunk-sneaker',
    name: 'AeroPulse X9 - Cyber Runners',
    metadata: {
      campaignName: 'Streetwear Drop 2026',
      vertical: 'ecommerce'
    },
    theme: {
      primaryColor: '#f43f5e', // Rose
      accentColor: '#f59e0b',  // Amber
      backgroundColor: '#0b090a',
      backgroundGradient: 'linear-gradient(135deg, #0b090a 0%, #161a1d 50%, #2b0c16 100%)',
      textColor: '#ffffff',
      mutedTextColor: '#a1a1aa',
      glassmorphism: true,
      cornerRadius: 14
    },
    elements: [
      {
        id: 'brand-2',
        role: 'branding',
        priority: 30,
        name: 'PULSE LABS',
        tagline: 'Zero-G Footwear',
        dropThreshold: 15
      },
      {
        id: 'badge-2',
        role: 'badge',
        priority: 65,
        text: '🔥 EXCLUSIVE DROP',
        colorTheme: 'rose',
        dropThreshold: 20
      },
      {
        id: 'headline-2',
        role: 'headline',
        priority: 95,
        text: 'AeroPulse X9 Anti-Gravity Runners',
        baseFontSize: 28,
        weight: 'black'
      },
      {
        id: 'subhead-2',
        role: 'subhead',
        priority: 45,
        text: 'Ultra-light carbon fiber spring plate engineered for effortless speed.',
        baseFontSize: 14,
        dropThreshold: 35
      },
      {
        id: 'media-2',
        role: 'media',
        priority: 85,
        src: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80',
        alt: 'AeroPulse Cyber Sneaker',
        fitMode: 'cover',
        accentGlow: 'rgba(244, 63, 94, 0.4)'
      },
      {
        id: 'rating-2',
        role: 'rating',
        priority: 35,
        score: 4.8,
        reviewCount: 920,
        dropThreshold: 25
      },
      {
        id: 'price-2',
        role: 'price',
        priority: 75,
        currentPrice: '$189',
        originalPrice: '$240',
        discountText: 'Limited Stock'
      },
      {
        id: 'cta-2',
        role: 'cta',
        priority: 100,
        label: 'Claim Pair Now',
        variant: 'primary',
        minTapWidth: 44,
        minTapHeight: 44
      },
      {
        id: 'legal-2',
        role: 'legal',
        priority: 10,
        text: 'Free express shipping worldwide. 30-day money-back guarantee.',
        dropThreshold: 45
      }
    ]
  },
  {
    id: 'spec-gourmet-coffee',
    name: 'Aura Roasters - Cold Brew',
    metadata: {
      campaignName: 'Direct Trade Coffee',
      vertical: 'f&b'
    },
    theme: {
      primaryColor: '#d97706', // Amber
      accentColor: '#10b981',  // Emerald
      backgroundColor: '#130e0a',
      backgroundGradient: 'linear-gradient(135deg, #130e0a 0%, #1f1610 50%, #2e1d10 100%)',
      textColor: '#fef3c7',
      mutedTextColor: '#d4b996',
      glassmorphism: true,
      cornerRadius: 18
    },
    elements: [
      {
        id: 'brand-3',
        role: 'branding',
        priority: 40,
        name: 'AURA ROASTERS',
        tagline: 'Artisanal Single-Origin',
        dropThreshold: 15
      },
      {
        id: 'badge-3',
        role: 'badge',
        priority: 55,
        text: '☕ ETHIOPIAN YIRGACHEFFE',
        colorTheme: 'amber',
        dropThreshold: 20
      },
      {
        id: 'headline-3',
        role: 'headline',
        priority: 95,
        text: 'Craft Cold Brew Steeped for 24 Hours',
        baseFontSize: 26,
        weight: 'bold'
      },
      {
        id: 'subhead-3',
        role: 'subhead',
        priority: 45,
        text: 'Silky smooth profile with natural notes of dark chocolate and bergamot citrus.',
        baseFontSize: 14,
        dropThreshold: 30
      },
      {
        id: 'media-3',
        role: 'media',
        priority: 80,
        src: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=800&q=80',
        alt: 'Cold Brew Bottle',
        fitMode: 'cover',
        accentGlow: 'rgba(217, 119, 6, 0.4)'
      },
      {
        id: 'rating-3',
        role: 'rating',
        priority: 35,
        score: 5.0,
        reviewCount: 4120,
        dropThreshold: 25
      },
      {
        id: 'price-3',
        role: 'price',
        priority: 70,
        currentPrice: '$16.50',
        discountText: 'Pack of 4'
      },
      {
        id: 'cta-3',
        role: 'cta',
        priority: 100,
        label: 'Order Fresh Batch',
        variant: 'pill',
        minTapWidth: 44,
        minTapHeight: 44
      },
      {
        id: 'legal-3',
        role: 'legal',
        priority: 10,
        text: 'USDA Organic & 100% Fair Trade Certified direct from farmers.',
        dropThreshold: 40
      }
    ]
  }
];

// ==========================================
// SURFACE PROFILE DEFINITIONS
// ==========================================

export const PRESET_SURFACES: SurfaceProfile[] = [
  {
    id: 'mobile-portrait',
    name: 'Mobile Portrait',
    description: 'Tall 9:16 mobile interstitial or story ad with top notch and bottom bar safe areas',
    width: 390,
    height: 844,
    dpr: 3,
    viewingDistance: 'near',
    interactionMode: 'touch',
    safeInsets: { top: 48, right: 16, bottom: 34, left: 16 },
    minTapTarget: 44,
    minTextSize: 12,
    targetFps: 60
  },
  {
    id: 'mobile-landscape',
    name: 'Mobile Landscape',
    description: 'Wide 16:9 full-bleed gaming or video interstitial with side safe margins',
    width: 844,
    height: 390,
    dpr: 3,
    viewingDistance: 'near',
    interactionMode: 'touch',
    safeInsets: { top: 16, right: 44, bottom: 20, left: 44 },
    minTapTarget: 44,
    minTextSize: 12,
    targetFps: 60
  },
  {
    id: 'broadcast-lower-third',
    name: 'Broadcast Lower-Third',
    description: 'Ultra-wide 32:5 live stream overlay banner; far viewing distance requires larger typography',
    width: 1200,
    height: 190,
    dpr: 1,
    viewingDistance: 'far',
    interactionMode: 'passive_broadcast',
    safeInsets: { top: 14, right: 32, bottom: 14, left: 32 },
    minTapTarget: 0,
    minTextSize: 18,
    targetFps: 60
  },
  {
    id: 'square-kiosk',
    name: 'Square Retail Kiosk',
    description: '1:1 interactive touch terminal in public venues with high touch targets',
    width: 600,
    height: 600,
    dpr: 2,
    viewingDistance: 'medium',
    interactionMode: 'kiosk_touch',
    safeInsets: { top: 24, right: 24, bottom: 24, left: 24 },
    minTapTarget: 48,
    minTextSize: 14,
    targetFps: 60
  },
  {
    id: 'nano-micro-ad',
    name: 'Ultra-Compact Nano Ad',
    description: 'Severely constrained (300x130) space testing aggressive priority degradation',
    width: 300,
    height: 130,
    dpr: 2,
    viewingDistance: 'near',
    interactionMode: 'touch',
    safeInsets: { top: 8, right: 8, bottom: 8, left: 8 },
    minTapTarget: 40,
    minTextSize: 11,
    maxElements: 3,
    targetFps: 60
  }
];
