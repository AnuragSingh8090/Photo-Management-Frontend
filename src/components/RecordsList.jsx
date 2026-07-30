import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MdDelete, MdEdit } from 'react-icons/md'
import { deleteRecord } from '../services/api'

// SVG Icons
const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <path d="m21 21-4.35-4.35"/>
  </svg>
)

const EmptyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-16 h-16 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const FilterIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
  </svg>
)

const SortAscIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 5h10"/>
    <path d="M11 9h7"/>
    <path d="M11 13h4"/>
    <path d="m3 17 3 3 3-3"/>
    <path d="M6 18V4"/>
  </svg>
)

const SortDescIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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

/**
 * RecordsList Component
 * Vertical list layout with search and filter
 */
function RecordsList({ records, onEdit, onDelete, loading }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortOrder, setSortOrder] = useState('newest') // 'newest' or 'oldest'
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
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
    if (!window.confirm('Delete this record?')) {
      return
    }

    try {
      await deleteRecord(id)
      onDelete()
    } catch (error) {
      console.error('Error deleting record:', error)
    }
  }

  const handleSortChange = (order) => {
    setSortOrder(order)
    setIsDropdownOpen(false)
  }

  // Skeleton Loader Component
  const SkeletonCard = ({ index }) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: index * 0.05 }}
      className="flex gap-2 p-2 bg-gray-50 rounded-md"
    >
      <div className="w-12 h-12 rounded-md bg-gray-200 animate-pulse" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4" />
        <div className="h-2 bg-gray-200 rounded animate-pulse w-1/2" />
      </div>
    </motion.div>
  )

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full flex flex-col bg-white border-l border-gray-200 overflow-hidden"
    >
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xl font-bold text-gray-800">
            Records
          </h2>
          
          {/* Custom Filter Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg text-gray-700 transition-smooth text-sm"
              title="Sort records"
            >
              <FilterIcon />
              <span className="font-medium">
                {sortOrder === 'newest' ? 'Newest First' : 'Oldest First'}
              </span>
            </motion.button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden"
                >
                  <div className="py-1">
                    <button
                      onClick={() => handleSortChange('newest')}
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-3 transition-smooth ${
                        sortOrder === 'newest'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
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
                      className={`w-full px-4 py-2.5 text-left text-sm flex items-center justify-between gap-3 transition-smooth ${
                        sortOrder === 'oldest'
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
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

        {/* Search Bar */}
        <div className="relative">
          <SearchIcon />
          <input
            type="text"
            placeholder="Search records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-smooth"
          />
        </div>
      </div>

      {/* Records List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-2">
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
            <p className="text-sm font-medium text-gray-600 mt-4">No records found</p>
            <p className="text-xs text-gray-400 mt-1">
              {searchTerm ? 'Try a different search' : 'Add your first photo'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-1 p-2">
            <AnimatePresence mode="popLayout">
              {filteredRecords.map((record, index) => (
                <motion.div
                  key={record.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="flex gap-2 p-2 bg-gray-50 hover:bg-gray-100 rounded-md transition-smooth group"
                >
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0 bg-gray-200">
                    <img
                      src={record.image}
                      alt={record.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-semibold text-gray-800 truncate">
                      {record.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      📅 {record.date} ⏰ {record.time}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => onEdit(record)}
                      className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-md transition-smooth"
                      title="Edit"
                    >
                      <MdEdit size={14} />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDelete(record.id)}
                      className="p-1.5 text-red-600 hover:bg-red-100 rounded-md transition-smooth"
                      title="Delete"
                    >
                      <MdDelete size={14} />
                    </motion.button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default RecordsList
