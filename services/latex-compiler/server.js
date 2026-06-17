const express = require('express');
const cors = require('cors');
const { execFile } = require('child_process');
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('fs');
const { join } = require('path');
const { tmpdir } = require('os');
const { promisify } = require('util');

const execAsync = promisify(execFile);
const app = express();

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.post('/compile', async (req, res) => {
  const { latex } = req.body;

  if (!latex || typeof latex !== 'string') {
    return res.status(400).json({ error: "Missing 'latex' field in request body" });
  }

  const tmpDir = mkdtempSync(join(tmpdir(), 'resumint-'));
  const texPath = join(tmpDir, 'resume.tex');
  const pdfPath = join(tmpDir, 'resume.pdf');

  writeFileSync(texPath, latex, 'utf-8');

  try {
    // First pass
    await execAsync('pdflatex', [
      '-interaction=nonstopmode',
      '-output-directory', tmpDir,
      texPath,
    ], { timeout: 30000 });
  } catch (error) {
    // pdflatex often exits with error codes even on successful PDF creation if there are minor LaTeX warnings.
    // We will attempt a second pass, and then check if the PDF exists.
    try {
      await execAsync('pdflatex', [
        '-interaction=nonstopmode',
        '-output-directory', tmpDir,
        texPath,
      ], { timeout: 30000 });
    } catch (e) {
      // Ignore second pass error
    }
  }

  try {
    const pdf = readFileSync(pdfPath);
    rmSync(tmpDir, { recursive: true, force: true });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=resume.pdf');
    res.send(pdf);
  } catch (err) {
    rmSync(tmpDir, { recursive: true, force: true });
    console.error("Failed to read PDF:", err);
    res.status(500).json({ error: "Failed to compile LaTeX to PDF" });
  }
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`LaTeX Compiler Service listening on port ${PORT}`);
});
