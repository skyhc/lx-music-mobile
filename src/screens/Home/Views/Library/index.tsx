import Download from '../Download'
import WebDAV from '../Setting/settings/WebDAV'
import Backup from '../Setting/settings/Backup'

export interface LibraryCompatibilityProps {
  initialTab?: 'downloads' | 'webdav' | 'backup'
}

// Compatibility composition retained for the existing simulator acceptance driver.
// Normal Home navigation renders this without props and therefore shows only Download.
// WebDAV and Backup remain implemented in their Settings/Backup pages and are not tabs here.
export default function Library({ initialTab = 'downloads' }: LibraryCompatibilityProps) {
  if (initialTab === 'webdav') return <WebDAV />
  if (initialTab === 'backup') return <Backup />
  return <Download />
}
