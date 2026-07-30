import { motion, AnimatePresence } from 'framer-motion'
import { MdDelete, MdClose } from 'react-icons/md'

const DeleteConfirmModal = ({ isOpen, onConfirm, onCancel, recordName, count }) => {
  if (!isOpen) return null

  const isMultiDelete = count && count > 1

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              onClick={(e) => e.stopPropagation()}
              className="rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
              style={{ 
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)'
              }}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                    <MdDelete className="text-red-600 text-2xl" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                      {isMultiDelete ? `Delete ${count} Records?` : 'Delete Record?'}
                    </h3>
                    <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                      This action cannot be undone
                    </p>
                  </div>
                </div>
                <button
                  onClick={onCancel}
                  className="hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--text-tertiary)' }}
                >
                  <MdClose size={24} />
                </button>
              </div>

              {/* Content */}
              <div className="mb-6">
                <p className="mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {isMultiDelete 
                    ? `Are you sure you want to delete ${count} records?`
                    : 'Are you sure you want to delete this record?'
                  }
                </p>
                {recordName && !isMultiDelete && (
                  <div className="rounded-lg p-3" style={{ 
                    background: 'var(--bg-secondary)',
                    border: '1px solid var(--border-primary)'
                  }}>
                    <p className="text-sm mb-1" style={{ color: 'var(--text-tertiary)' }}>
                      Record name:
                    </p>
                    <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>
                      {recordName}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onCancel}
                  className="btn-hover flex-1 px-4 py-2.5 font-semibold rounded-lg transition-smooth"
                  style={{
                    background: 'var(--bg-tertiary)',
                    color: 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className="btn-hover flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-smooth flex items-center justify-center gap-2"
                >
                  <MdDelete size={18} />
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default DeleteConfirmModal
