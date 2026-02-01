import React from 'react';
import { motion } from 'framer-motion';

// Page-level loading spinner
export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
      <div className="text-center">
        <motion.div
          className="w-16 h-16 border-4 border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full mx-auto mb-4"
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
        <p className="text-gray-600 dark:text-gray-400 font-medium">
          Loading...
        </p>
      </div>
    </div>
  );
}

// Inline loading spinner
export function Spinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-3',
    lg: 'w-12 h-12 border-4',
  };

  return (
    <motion.div
      className={`${sizes[size]} border-blue-200 dark:border-blue-900 border-t-blue-600 dark:border-t-blue-400 rounded-full ${className}`}
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
    />
  );
}

// Skeleton loader for content
export function SkeletonLine({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-200 dark:bg-gray-800 rounded animate-pulse ${className}`} />
  );
}

// Skeleton loader for documentation pages
export function DocsSkeleton() {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Title skeleton */}
      <SkeletonLine className="h-10 w-3/4" />
      
      {/* Subtitle skeleton */}
      <SkeletonLine className="h-4 w-1/2" />
      
      {/* Content skeleton */}
      <div className="space-y-3 pt-6">
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-5/6" />
      </div>
      
      <div className="space-y-3 pt-4">
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-4/5" />
      </div>
      
      {/* Code block skeleton */}
      <SkeletonLine className="h-32 w-full mt-6" />
      
      <div className="space-y-3 pt-6">
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-full" />
        <SkeletonLine className="h-4 w-3/4" />
      </div>
    </div>
  );
}

// Skeleton loader for cards
export function CardSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-4">
      <SkeletonLine className="h-6 w-3/4" />
      <SkeletonLine className="h-4 w-full" />
      <SkeletonLine className="h-4 w-5/6" />
      <div className="pt-2">
        <SkeletonLine className="h-10 w-32" />
      </div>
    </div>
  );
}

// Loading state for tables
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="p-3">
                <SkeletonLine className="h-4" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <tr key={rowIndex}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <td key={colIndex} className="p-3">
                  <SkeletonLine className="h-4" />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Loading overlay for buttons
export function ButtonLoader() {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
      />
      <span>Loading...</span>
    </div>
  );
}

// Pulsing dots loader
export function DotsLoader() {
  return (
    <div className="flex gap-2 items-center">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: i * 0.2,
          }}
        />
      ))}
    </div>
  );
}

// Progress bar
export function ProgressBar({ progress, className = '' }: { progress: number; className?: string }) {
  return (
    <div className={`w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2 overflow-hidden ${className}`}>
      <motion.div
        className="h-full bg-blue-600 dark:bg-blue-400 rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        transition={{ duration: 0.3 }}
      />
    </div>
  );
}

// Suspense fallback
export function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center p-12">
      <DotsLoader />
    </div>
  );
}

// Full page loading state with logo
export function FullPageLoader({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 flex items-center justify-center z-50">
      <div className="text-center space-y-6">
        {/* Logo placeholder - replace with actual logo */}
        <motion.div
          className="text-6xl font-bold text-blue-600 dark:text-blue-400"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          KoreShield
        </motion.div>
        
        <div className="flex flex-col items-center gap-4">
          <DotsLoader />
          <p className="text-gray-600 dark:text-gray-400 font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

// Shimmer effect loader
export function ShimmerLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden bg-gray-200 dark:bg-gray-800 ${className}`}>
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{
          x: ['-100%', '100%'],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          ease: 'linear',
        }}
      />
    </div>
  );
}

export default PageLoader;
