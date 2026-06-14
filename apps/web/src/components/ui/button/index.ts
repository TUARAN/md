import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Button } from './Button.vue'

export const buttonVariants = cva(
  `inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-150 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px`,
  {
    variants: {
      variant: {
        default: `bg-primary text-primary-foreground shadow-sm shadow-primary/15 hover:bg-primary/90 hover:shadow-md hover:shadow-primary/15`,
        destructive:
          `bg-destructive text-destructive-foreground shadow-sm shadow-destructive/15 hover:bg-destructive/90`,
        outline:
          `border border-input bg-card shadow-xs hover:border-primary/40 hover:bg-accent/70 hover:text-accent-foreground`,
        secondary:
          `bg-secondary text-secondary-foreground hover:bg-secondary/82`,
        ghost: `hover:bg-accent/75 hover:text-accent-foreground`,
        link: `text-primary underline-offset-4 hover:underline`,
      },
      size: {
        default: `h-10 px-4 py-2`,
        xs: `h-7 rounded px-2`,
        sm: `h-9 rounded-md px-3`,
        lg: `h-11 rounded-md px-8`,
        icon: `h-10 w-10`,
      },
    },
    defaultVariants: {
      variant: `default`,
      size: `default`,
    },
  },
)

export type ButtonVariants = VariantProps<typeof buttonVariants>
