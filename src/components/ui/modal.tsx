'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from 'components/ui/dialog'
import { TriangleAlert } from "lucide-react";

import React from 'react'

type ModalProps = {
  title: string
  isOpen: boolean
  children: React.ReactNode
  onClose: () => void
  className?: string
  description?: string
}

export const Modal = ({
  title,
  isOpen,
  onClose,
  children,
  className,
  description = ""
}: ModalProps) => {
  const onChange = (open: boolean) => {
    if (!open) onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onChange}>
      <DialogContent className={`bg-white border-gray-200 ${className || ''}`}>
        <DialogHeader>
          <div className='flex flex-row items-center space-x-3'>
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
              <TriangleAlert data-testid="triangle-alert" className="w-4 h-4 text-purple-600" />
            </div>
            <DialogTitle className="text-gray-900">{title}</DialogTitle>
          </div>
          {description && (
            <DialogDescription className="text-gray-500 mt-2">{description}</DialogDescription>
          )}
        </DialogHeader>
        <div>{children}</div>
      </DialogContent>
    </Dialog>
  )
}
