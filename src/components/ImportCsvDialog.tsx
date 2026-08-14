import { useRef, useState } from 'react'
import { parseCSV, rowsToState, type ImportRow } from '../utils/csv'
import { CATEGORY_LABELS } from '../utils/catalog'
import type { ItemSpec, SelectedItem } from '../types'

const MAX_FILE_BYTES = 1_000_000

interface ImportCsvDialogProps {
  onImport: (payload: { customItems: ItemSpec[]; selectedItems: SelectedItem[] }) => void
  label: string
  className?: string
}

/**
 * Two steps on purpose, the way LighterPack does it: parse, show what we understood,
 * then import. Nothing touches the user's setup until they've seen the table —
 * a silent import that mangles half a gear list is worse than no import.
 */
export function ImportCsvDialog({ onImport, label, className }: ImportCsvDialogProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ImportRow[] | null>(null)
  const [skipped, setSkipped] = useState(0)
  const [error, setError] = useState<string | null>(null)

  function pickFile() {
    setError(null)
    inputRef.current?.click()
  }

  function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    // Reset so picking the same file twice still fires a change event.
    event.target.value = ''
    if (!file) return

    if (file.size > MAX_FILE_BYTES) {
      setError("That file is bigger than 1 MB — that's not a gear list, that's a spreadsheet.")
      return
    }

    const reader = new FileReader()
    reader.onerror = () => setError("Couldn't read that file. Try exporting it again.")
    reader.onload = () => {
      const result = parseCSV(String(reader.result ?? ''))
      if (result.rows.length === 0) {
        setError(
          "We couldn't find any gear in there. A LighterPack export works as-is — it needs columns for name, category, description, quantity, weight and unit."
        )
        return
      }
      setRows(result.rows)
      setSkipped(result.skipped)
      setError(null)
    }
    reader.readAsText(file)
  }

  function confirm() {
    if (!rows) return
    onImport(rowsToState(rows))
    setRows(null)
  }

  const withoutVolume = rows?.filter(r => r.volume === 0).length ?? 0

  return (
    <>
      <button onClick={pickFile} className={className}>
        {label}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        onChange={handleFile}
        className="hidden"
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <div role="alert" className="mt-3 bg-error/10 border border-error/20 rounded-xl p-4 text-small text-error text-left">
          {error}
        </div>
      )}

      {rows && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Confirm your import"
          className="fixed inset-0 z-50 bg-neutral/40 flex items-end sm:items-center justify-center p-0 sm:p-6"
        >
          <div className="bg-base-100 rounded-t-2xl sm:rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col text-left">
            <div className="p-6 pb-4 border-b border-base-300">
              <h2 className="heading-lg">Here's what we found</h2>
              <p className="text-body text-base-content/60 mt-1">
                {rows.length} {rows.length === 1 ? 'item' : 'items'} ready to add to your list.
                {skipped > 0 && ` We skipped ${skipped} ${skipped === 1 ? 'line' : 'lines'} we couldn't read.`}
              </p>
              {withoutVolume > 0 && (
                <p className="text-small text-base-content/60 mt-2">
                  {withoutVolume === rows.length ? 'None of these' : `${withoutVolume} of these`} come with a size,
                  so they won't count toward how full your bags are until you add one. LighterPack doesn't track volume.
                </p>
              )}
            </div>

            {/* Long item names would push the four columns past a phone screen —
                let the table scroll inside itself rather than the whole dialog. */}
            <div className="overflow-y-auto overflow-x-auto flex-1 p-6 pt-4">
              <table className="table table-sm min-w-[28rem]">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Weight</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, i) => (
                    <tr key={i}>
                      <td className="font-medium">
                        {row.name}
                        {(row.worn || row.consumable) && (
                          <span className="text-base-content/50 font-normal">
                            {row.worn && ' · worn'}
                            {row.consumable && ' · eat/drink'}
                          </span>
                        )}
                      </td>
                      <td className="text-base-content/60">
                        {CATEGORY_LABELS[row.category]}
                        {row.sourceCategory && row.category === 'other' && (
                          <span className="opacity-60"> ← {row.sourceCategory}</span>
                        )}
                      </td>
                      <td className="text-right tabular-nums">×{row.qty}</td>
                      <td className="text-right tabular-nums">{row.weight}g</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-6 pt-4 border-t border-base-300 flex gap-3">
              <button onClick={confirm} className="btn btn-primary flex-1">
                Add {rows.length} {rows.length === 1 ? 'item' : 'items'}
              </button>
              <button onClick={() => setRows(null)} className="btn btn-ghost">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
