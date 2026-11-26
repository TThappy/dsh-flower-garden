'use strict'

// Mirrors the client's normalizePetSize: an empty or unparseable value means the
// default, a numeric string still counts, and the result stays inside 50..150.
function normalizePetSize(value) {
  if (value === null || value === undefined || String(value).trim() === '') return 100
  const number = Number(value)
  return Number.isFinite(number) ? Math.min(150, Math.max(50, Math.round(number))) : 100
}

function petDimensions(value) {
  const scale = normalizePetSize(value) / 100
  return {width: Math.round(280 * scale), height: Math.round(300 * scale)}
}

module.exports = {normalizePetSize, petDimensions}
