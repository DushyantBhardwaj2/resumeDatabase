'use client'

import { motion } from 'motion/react'
import type { ReactNode } from 'react'

interface AnimatedListProps<T> {
  items: T[]
  renderItem: (item: T, index: number) => ReactNode
  className?: string
  delay?: number
}

export function AnimatedList<T>({
  items,
  renderItem,
  className = '',
  delay = 0.05,
}: AnimatedListProps<T>) {
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-50px' }}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: delay } },
      }}
      className={className}
    >
      {items.map((item, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          {renderItem(item, index)}
        </motion.div>
      ))}
    </motion.div>
  )
}
