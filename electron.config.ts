import { spawn } from 'child_process'
import { join } from 'path'

export default {
  config: {
    rebuild: true
  },
  builder: {
    beforeBuild: async () => {
      console.log('Running pre-build tasks...')
    }
  }
}
