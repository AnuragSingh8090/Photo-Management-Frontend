import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdDelete, MdEdit, MdCalendarToday, MdAccessTime } from 'react-icons/md'
import { toast } from 'react-toastify'
import { deleteRecord, deleteMultipleRecords } from '../services/api'
import DeleteConfirmModal from './DeleteConfirmModal'
import { formatTime } from '../utils/dateTime'

// SVG Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 lg:w-4 lg:h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

const EmptyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 lg:w-16 lg:h-16" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 lg:w-5 lg:h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

const SortAscIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 lg:w-4 lg:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h10"/>
    <path d="M11 9h7"/>
    <path d="M11 13h4"/>
    <path d="m3 17 3 3 3-3"/>
    <path d="M6 18V4"/>
  </svg>
)

const SortDescIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3 lg:w-4 lg:h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h10"/>
    <path d="M11 9h7"/>
    <path d="M11 13h4"/>
    <path d="m3 7 3-3 3 3"/>
    <path d="M6 4v14"/>
  </svg>
)

const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const ImagePlaceholderIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 lg:w-8 lg:h-8" style={{ color: 'var(--text-tertiary)' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

/**
 * ImageWithPlaceholder Component
 * Shows placeholder while loading or on error
 */
const ImageWithPlaceholder = ({ src, alt }) => {
  const [imageState, setImageState] = useState('loading') // 'loading', 'loaded', 'error'

  return (
    <div className="w-12 h-12 lg:w-20 lg:h-20 rounded-lg overflow-hidden flex-shrink-0 relative" style={{ 
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-primary)'
    }}>
      {imageState === 'loading' && (
        <div className="w-full h-full flex items-center justify-center">
          <div className="animate-pulse">
            <ImagePlaceholderIcon />
          </div>
        </div>
      )}
      
      {imageState === 'error' && (
        <div className="w-full h-full flex flex-col items-center justify-center">
          <ImagePlaceholderIcon />
          <span className="text-[10px] mt-1" style={{ color: 'var(--text-tertiary)' }}>No Image</span>
        </div>
      )}
      
      <img
        src={src}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          imageState === 'loaded' ? 'opacity-100' : 'opacity-0 absolute'
        }`}
        onLoad={() => setImageState('loaded')}
        onError={() => setImageState('error')}
      />
    </div>
  )
}

/**
 * RecordsList Component
 * Vertical list layout with search and filter
 */
function RecordsList({ records, onEdit, onDelete, loading, editingId }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' or 'oldest'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [recordToDelete, setRecordToDelete] = useState(null)
  const [selectedIds, setSelectedIds] = useState([])
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false)
  const [multiDeleteModalOpen, setMultiDeleteModalOpen] = useState(false)
  const dropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Filter and sort records
  const filteredRecords = records
    .filter(record =>
      record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.date.includes(searchTerm)
    )
    .sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time}`)
      const dateB = new Date(`${b.date}T${b.time}`)
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB
    })

  const handleDelete = async (id) => {
    try {
      await deleteRecord(id)
      onDelete()
      setDeleteModalOpen(false)
      setRecordToDelete(null)
      toast.success('Record deleted successfully', { autoClose: 2000 })
    } catch (error) {
      console.error('Error deleting record:', error)
      toast.error('Failed to delete record', { autoClose: 2000 })
    }
  }

  const handleMultiDelete = async () => {
    if (selectedIds.length === 0) return
    
    try {
      await deleteMultipleRecords(selectedIds)
      onDelete()
      const count = selectedIds.length
      setSelectedIds([])
      setIsMultiSelectMode(false)
      setMultiDeleteModalOpen(false)
      toast.success(`${count} record${count > 1 ? 's' : ''} deleted successfully`, { autoClose: 2000 })
    } catch (error) {
      console.error('Error deleting records:', error)
      toast.error('Failed to delete records', { autoClose: 2000 })
    }
  }

  const openMultiDeleteModal = () => {
    if (selectedIds.length > 0) {
      setMultiDeleteModalOpen(true)
    }
  }

  const closeMultiDeleteModal = () => {
    setMultiDeleteModalOpen(false)
  }

  const openDeleteModal = (record) => {
    setRecordToDelete(record)
    setDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setDeleteModalOpen(false)
    setRecordToDelete(null)
  }

  const handleSortChange = (order) => {
    setSortOrder(order)
    setIsDropdownOpen(false)
  }

  const toggleSelectAll = () => {
    const selectableRecords = filteredRecords.filter(r => r.id !== editingId)
    if (selectedIds.length === selectableRecords.length && selectableRecords.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(selectableRecords.map(r => r.id))
    }
  }

  const toggleSelect = (id) => {
    if (id === editingId) return // prevent selecting the editing record
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const isAllSelected = filteredRecords.length > 0 && selectedIds.length === filteredRecords.length

  // Skeleton Loader Component
  const SkeletonCard = ({ index }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-3 p-3 rounded-lg shadow-sm"
      style={{ 
        background: 'var(--bg-primary)',
        border: '1px solid var(--border-primary)'
      }}
    >
      <div className="w-12 h-12 lg:w-20 lg:h-20 rounded-lg animate-pulse flex-shrink-0" style={{ background: 'var(--bg-tertiary)' }} />
      <div className="flex-1 space-y-2">
        <div className="h-4 rounded animate-pulse w-3/4" style={{ background: 'var(--bg-tertiary)' }} />
        <div className="h-3 rounded animate-pulse w-1/2" style={{ background: 'var(--bg-tertiary)' }} />
        <div className="h-3 rounded animate-pulse w-1/2" style={{ background: 'var(--bg-tertiary)' }} />
      </div>
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col overflow-hidden border-t md:border-t-0 md:border-l"
      style={{ 
        background: 'var(--bg-primary)',
        borderColor: 'var(--border-primary)'
      }}
    >
      {/* Header */}
      <div className="px-2 py-1.5 lg:px-4 lg:py-3 flex-shrink-0" style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="flex items-center justify-between mb-1 lg:mb-2.5">
          <div className="flex items-center gap-1.5 lg:gap-2">
            <h2 className="text-base lg:text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Records
            </h2>
            {!loading && records.length > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="text-white text-xs font-bold px-2 py-1 rounded-full"
                style={{ background: 'var(--accent-blue)' }}
              >
                {records.length}
              </motion.span>
            )}
          </div>
          
          {/* Custom Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="btn-hover flex items-center gap-1.5 lg:gap-2 px-2 py-1 lg:px-3 lg:py-1.5 rounded-lg transition-smooth text-[11px] lg:text-sm"
              style={{
                background: 'var(--bg-secondary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'var(--bg-secondary)'}
              title="Sort records"
            >
              <FilterIcon />
              <span className="font-medium">
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </span>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 rounded-lg shadow-lg z-50 overflow-hidden"
                  style={{
                    background: 'var(--bg-primary)',
                    border: '1px solid var(--border-primary)'
                  }}
                >
                  <div className="py-1">
                    <button
                      onClick={() => handleSortChange('newest')}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-3 transition-smooth"
                      style={{
                        background: sortOrder === 'newest' ? 'var(--accent-blue-light)' : 'transparent',
                        color: sortOrder === 'newest' ? 'var(--accent-blue)' : 'var(--text-primary)'
                      }}
                      onMouseEnter={(e) => {
                        if (sortOrder !== 'newest') e.currentTarget.style.background = 'var(--bg-hover)'
                      }}
                      onMouseLeave={(e) => {
                        if (sortOrder !== 'newest') e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <SortDescIcon />
                        <span className="font-medium">Newest First</span>
                      </div>
                      {sortOrder === 'newest' && (
                        <CheckIcon />
                      )}
                    </button>
                    <button
                      onClick={() => handleSortChange('oldest')}
                      className="w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-3 transition-smooth"
                      style={{
                        background: sortOrder === 'oldest' ? 'var(--accent-blue-light)' : 'transparent',
                        color: sortOrder === 'oldest' ? 'var(--accent-blue)' : 'var(--text-primary)'
                      }}
                      onMouseEnter={(e) => {
                        if (sortOrder !== 'oldest') e.currentTarget.style.background = 'var(--bg-hover)'
                      }}
                      onMouseLeave={(e) => {
                        if (sortOrder !== 'oldest') e.currentTarget.style.background = 'transparent'
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <SortAscIcon />
                        <span className="font-medium">Oldest First</span>
                      </div>
                      {sortOrder === 'oldest' && (
                        <CheckIcon />
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Multi-select and Search Row */}
        <div className="flex items-center gap-2">
          {/* Select All Checkbox - Icon Only */}
          <label 
            className="flex items-center justify-center cursor-pointer w-9 h-9 rounded-lg transition-smooth" 
            style={{ 
              userSelect: 'none',
              background: 'transparent'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-hover)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            title="Select All"
          >
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={toggleSelectAll}
              className="w-5 h-5 cursor-pointer"
              style={{ 
                accentColor: 'var(--accent-blue)',
                borderRadius: '6px'
              }}
            />
          </label>

          {/* Search Bar */}
          <div className="relative flex-1">
            <SearchIcon />
            <input
              type="text"
              placeholder="Search records..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-2 py-1 lg:pl-10 lg:pr-3 lg:py-2 rounded-lg text-[11px] lg:text-sm focus:outline-none transition-smooth"
              style={{
                background: 'var(--bg-primary)',
                border: '1px solid var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--accent-blue)'
                e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-blue-light)'
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-primary)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            />
          </div>

          {/* Delete Selected Button */}
          <button
            onClick={openMultiDeleteModal}
            disabled={selectedIds.length === 0}
            className="btn-hover p-2 rounded-lg transition-smooth border"
            style={{
              background: selectedIds.length > 0 ? '#dc2626' : 'var(--bg-tertiary)',
              borderColor: selectedIds.length > 0 ? '#dc2626' : 'var(--border-primary)',
              color: selectedIds.length > 0 ? 'white' : 'var(--text-tertiary)',
              cursor: selectedIds.length > 0 ? 'pointer' : 'not-allowed'
            }}
            title={selectedIds.length > 0 ? `Delete ${selectedIds.length} selected` : 'Select items to delete'}
          >
            <MdDelete size={20} />
          </button>
        </div>
      </div>

      {/* Records List */}
      <div className="flex-1 overflow-y-auto" style={{ background: 'var(--bg-secondary)' }}>
        {loading ? (
          <div className="space-y-2 p-3">
            {[...Array(5)].map((_, index) => (
              <SkeletonCard key={index} index={index} />
            ))}
          </div>
        ) : filteredRecords.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-full flex flex-col items-center justify-center text-center px-4"
          >
            <EmptyIcon />
            <p className="text-[11px] lg:text-sm font-medium mt-2 lg:mt-4" style={{ color: 'var(--text-secondary)' }}>
              No records found
            </p>
            <p className="text-[10px] lg:text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
              {searchTerm ? 'Try a different search' : 'Add your first photo'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-2 p-3">
            <AnimatePresence mode="popLayout">
              {filteredRecords.map((record, index) => {
                const isEditing = editingId === record.id
                const isSelected = selectedIds.includes(record.id)
                return (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: 20, scale: 0.95 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.03 }}
                  className="flex gap-3 p-3 rounded-lg transition-all shadow-sm hover:shadow-md relative group"
                  style={{
                    background: isEditing 
                      ? 'var(--bg-primary)'
                      : isSelected
                      ? 'var(--accent-blue-light)'
                      : 'var(--bg-primary)',
                    border: isEditing 
                      ? '2px dashed var(--accent-blue)'
                      : isSelected
                      ? '2px solid var(--accent-blue)'
                      : '2px solid transparent',
                    ...(isEditing && { boxShadow: '0 0 0 2px var(--accent-blue-light)' })
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected && !isEditing) {
                      e.currentTarget.style.background = 'var(--bg-hover)'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected && !isEditing) {
                      e.currentTarget.style.background = 'var(--bg-primary)'
                    }
                  }}
                >
                  {/* Checkbox - shows on hover or when selected, HIDDEN when editing */}
                  {!isEditing && (
                    <div 
                      className={`absolute top-2 left-2 z-10 ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(record.id)}
                        className="w-5 h-5 cursor-pointer"
                        style={{ 
                          accentColor: 'var(--accent-blue)',
                          borderRadius: '6px'
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}

                  {/* Thumbnail */}
                  <ImageWithPlaceholder 
                    src={record.image} 
                    alt={record.name}
                  />

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <h3 
                      className="text-[11px] lg:text-base font-bold mb-1 lg:mb-1.5 line-clamp-2"
                      style={{ color: 'var(--text-primary)' }}
                      title={record.name}
                    >
                      {record.name}
                    </h3>
                    <div className="space-y-0.5 lg:space-y-1">
                      <div className="flex items-center gap-1 lg:gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <MdCalendarToday className="w-3 h-3 lg:w-[15px] lg:h-[15px] flex-shrink-0" />
                        <span className="text-[9px] lg:text-sm font-medium">{record.date}</span>
                      </div>
                      <div className="flex items-center gap-1 lg:gap-1.5" style={{ color: 'var(--text-secondary)' }}>
                        <MdAccessTime className="w-3 h-3 lg:w-[15px] lg:h-[15px] flex-shrink-0" />
                        <span className="text-[9px] lg:text-sm font-medium">{formatTime(record.time)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions - hide when checkbox is visible or when editing */}
                  {!isSelected && !isEditing && (
                    <div className="flex flex-col gap-1 lg:gap-2 flex-shrink-0">
                      <button
                        onClick={() => onEdit(record)}
                        className="btn-hover p-1.5 lg:p-2 rounded-lg transition-smooth"
                        style={{ 
                          color: '#3b82f6',
                          border: '1px solid #3b82f6',
                          background: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                        title="Edit"
                      >
                        <MdEdit className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                      <button
                        onClick={() => openDeleteModal(record)}
                        className="btn-hover p-1.5 lg:p-2 rounded-lg transition-smooth"
                        style={{ 
                          color: '#dc2626',
                          border: '1px solid #dc2626',
                          background: 'transparent'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent'
                        }}
                        title="Delete"
                      >
                        <MdDelete className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
                      </button>
                    </div>
                  )}
                </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onConfirm={() => handleDelete(recordToDelete.id)}
        onCancel={closeDeleteModal}
        recordName={recordToDelete?.name}
      />

      {/* Multi-Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={multiDeleteModalOpen}
        onConfirm={handleMultiDelete}
        onCancel={closeMultiDeleteModal}
        count={selectedIds.length}
      />
    </motion.div>
  )
}

export default RecordsList
