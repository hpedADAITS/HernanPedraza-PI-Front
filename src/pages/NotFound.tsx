import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { motion } from 'motion/react';
import { ArrowLeft } from 'lucide-react';
import type { PageProps } from '@/types';

export function NotFound({ onNavigate }: PageProps) {
  return (
    <Layout theme="white" className="items-center justify-center min-h-screen">
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="text-center flex flex-col items-center gap-8"
      >
        <div className="text-8xl font-bold text-slate-400">404</div>

        <h1 className="text-4xl font-bold text-slate-800">Page Not Found</h1>

        <p className="text-lg text-slate-600 max-w-md">
          The page you're looking for doesn't exist. Let's get you back on
          track.
        </p>

        <motion.button
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          onClick={() => onNavigate('role-selection')}
          className="flex items-center gap-2 px-6 py-3 mt-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:from-blue-600 hover:to-blue-700 transition-all"
        >
          <ArrowLeft size={20} />
          Go Home
        </motion.button>
      </motion.div>
    </Layout>
  );
}
