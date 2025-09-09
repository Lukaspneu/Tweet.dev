import React from 'react'
import { Settings } from 'lucide-react'

interface SettingsButtonProps {
  onClick: () => void
}

const SettingsButton: React.FC<SettingsButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="p-1.5 text-white hover:text-[rgb(185,255,93)] transition-colors duration-200 focus:outline-none rounded-md"
    >
      <Settings className="w-4 h-4" />
    </button>
  )
}

export default SettingsButton
