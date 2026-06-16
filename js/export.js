// ================================================================
// NAP Export — ZIP download via JSZip CDN
// ================================================================
(function () {
  'use strict';

  window.Nap.export = {
    async downloadZip() {
      const fs = window.Nap.fs;
      if (!fs || fs.getFileCount() === 0) { alert('No files to export.'); return; }
      if (typeof JSZip === 'undefined')   { alert('JSZip not loaded.'); return; }

      const zip  = new JSZip();
      const name = window.Nap.state.project.name || 'project';

      fs.listFiles().forEach(path => {
        const content = fs.readFile(path);
        if (content !== null) zip.file(path, content);
      });

      try {
        const blob = await zip.generateAsync({ type: 'blob' });
        const url  = URL.createObjectURL(blob);
        const a    = Object.assign(document.createElement('a'), {
          href: url,
          download: name + '.zip',
        });
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (e) {
        console.error('Export failed:', e);
        alert('Export failed: ' + e.message);
      }
    },
  };
})();
