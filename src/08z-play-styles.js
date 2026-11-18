
    // §7b Backpack slots, daily play strip, rule tips and motion polish.
    const CSS = BASE_CSS + `
.fg-view{--fg-r-base:#9aa7a0;--fg-r-alt:#4fa3d8;--fg-r-hybrid:#8f7be0;--fg-r-curio:#e0762f;--fg-r-spirit:#d4af37}
.fg-view .fg-btn{border-radius:10px;transition:transform .12s ease,box-shadow .12s ease,background .12s ease}
.fg-view .fg-btn:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 3px 10px #0002}
.fg-view .fg-btn:active:not(:disabled){transform:translateY(0) scale(.97)}
.fg-view .fg-btnPrimary{background:var(--dsw-alias-state-success-primary);color:#fff;border-color:transparent;font-weight:600}
.fg-plot{transition:transform .16s ease,box-shadow .16s ease;border-radius:18px}
.fg-plot:hover{transform:translateY(-2px);box-shadow:0 8px 22px #0002}
.fg-plot[data-state="bloom"]{border-color:var(--fg-r-spirit);animation:fg-ready 2.4s ease-in-out infinite}
.fg-plot[data-variant="hidden"]{box-shadow:0 0 0 2px #d4af3755,0 8px 26px #d4af3733}
@keyframes fg-ready{0%,100%{box-shadow:0 0 0 0 #d4af3700}50%{box-shadow:0 0 0 5px #d4af3738}}
.fg-view .fg-toast[data-show=true]{animation:fg-pop .28s cubic-bezier(.2,1.4,.4,1)}
@keyframes fg-pop{from{opacity:0;transform:translateY(8px) scale(.94)}to{opacity:1;transform:none}}
.fg-tipRow{display:flex;align-items:flex-start;gap:10px;flex-wrap:wrap}
.fg-tip{font-size:.9em;color:var(--dsw-alias-label-secondary)}
.fg-tipToggle{display:inline-flex;align-items:center;gap:6px;cursor:pointer;list-style:none;user-select:none}
.fg-tipToggle::-webkit-details-marker{display:none}
.fg-tipMark{display:inline-flex;align-items:center;justify-content:center;width:1.5em;height:1.5em;border-radius:50%;border:1px solid var(--dsw-alias-border-l2);font-weight:700}
.fg-tip[open] .fg-tipMark{background:var(--dsw-alias-brand-primary);color:#fff;border-color:transparent}
.fg-tipBody{margin-top:8px;padding:10px 14px;border-radius:12px;background:var(--dsw-alias-bg-layer-2);max-inline-size:min(36em,100%);box-sizing:border-box;overflow-wrap:anywhere}
.fg-tipBody p{margin:0;line-height:1.65}
.fg-tipBody p+p{margin-top:.55em;padding-top:.55em;border-top:1px solid var(--dsw-alias-border-l1)}
.fg-slotGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(78px,1fr));gap:8px;align-content:start}
.fg-slot{appearance:none;position:relative;box-sizing:border-box;aspect-ratio:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:6px 4px 4px;border:2px solid var(--fg-r-base);border-radius:14px;background:linear-gradient(160deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2));color:var(--dsw-alias-label-primary);font:inherit;box-shadow:inset 0 -6px 12px #0000000f}
button.fg-slot{cursor:pointer;transition:transform .12s ease,box-shadow .12s ease}
button.fg-slot:hover{transform:translateY(-2px) scale(1.03);box-shadow:0 6px 16px #0003}
button.fg-slot[aria-pressed="true"]{outline:3px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-slot[data-rarity="alt"]{border-color:var(--fg-r-alt)}
.fg-slot[data-rarity="hybrid"]{border-color:var(--fg-r-hybrid)}
.fg-slot[data-rarity="curio"]{border-color:var(--fg-r-curio);background:linear-gradient(160deg,#e0762f1f,var(--dsw-alias-bg-layer-2))}
.fg-slot[data-rarity="spirit"]{border-color:var(--fg-r-spirit);background:linear-gradient(160deg,#d4af3738,var(--dsw-alias-bg-layer-2));animation:fg-shine 2.6s ease-in-out infinite}
@keyframes fg-shine{0%,100%{box-shadow:0 0 0 0 #d4af3700,inset 0 -6px 12px #0000000f}50%{box-shadow:0 0 14px 2px #d4af3766,inset 0 -6px 12px #0000000f}}
.fg-slotEmpty{border-style:dashed;border-color:var(--dsw-alias-border-l1);background:transparent;box-shadow:none}
.fg-slotArt{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;width:100%}
.fg-slotArt svg{width:44px;height:44px;overflow:visible}
.fg-slotName{max-width:100%;font-size:.72em;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--dsw-alias-label-secondary)}
.fg-slotCount{position:absolute;right:4px;top:3px;padding:0 5px;border-radius:999px;background:#000a;color:#fff;font-size:.72em;font-weight:700;font-variant-numeric:tabular-nums;line-height:1.5}
.fg-bagDialog{width:min(880px,calc(100vw - 28px))}
.fg-bagDialog .fg-inventoryHead{justify-content:flex-start;flex-wrap:wrap}.fg-bagClose{margin-left:auto}
.fg-bagFilters{display:flex;gap:6px;flex-wrap:wrap;padding:14px 24px 0}
.fg-bagFilter{appearance:none;font:inherit;cursor:pointer;padding:.35em .9em;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary)}
.fg-bagFilter[aria-pressed="true"]{background:var(--dsw-alias-label-primary);color:var(--dsw-alias-bg-base);border-color:transparent;font-weight:600}
.fg-bagFilterCount{opacity:.7;font-variant-numeric:tabular-nums}
.fg-bagBody{display:grid;grid-template-columns:minmax(0,1fr) 250px;gap:18px;padding:16px 24px 20px}
.fg-bagBody .fg-slotGrid{max-height:min(52vh,420px);overflow:auto;padding:4px}
.fg-bagDetail{display:flex;flex-direction:column;align-items:center;gap:8px;padding:16px;border-radius:18px;border:2px solid var(--fg-r-base);background:var(--dsw-alias-bg-layer-2);text-align:center}
.fg-bagDetail[data-rarity="alt"]{border-color:var(--fg-r-alt)}.fg-bagDetail[data-rarity="hybrid"]{border-color:var(--fg-r-hybrid)}.fg-bagDetail[data-rarity="curio"]{border-color:var(--fg-r-curio)}.fg-bagDetail[data-rarity="spirit"]{border-color:var(--fg-r-spirit);box-shadow:0 0 24px #d4af3740}
.fg-bagDetail h3{margin:0;font-size:1.15em;line-height:1.4}
.fg-bagDetailArt{width:140px;height:140px;display:flex;align-items:center;justify-content:center}.fg-bagDetailArt svg{width:132px;height:132px;overflow:visible}
.fg-bagTags{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;align-items:center}
.fg-rarityTag{padding:0 8px;border-radius:999px;font-size:.8em;font-weight:700;color:#fff;background:var(--fg-r-base)}
.fg-rarityTag[data-rarity="alt"]{background:var(--fg-r-alt)}.fg-rarityTag[data-rarity="hybrid"]{background:var(--fg-r-hybrid)}.fg-rarityTag[data-rarity="curio"]{background:var(--fg-r-curio)}.fg-rarityTag[data-rarity="spirit"]{background:var(--fg-r-spirit);color:#241b07}
.fg-bagActions{display:flex;flex-direction:column;gap:8px;width:100%;margin-top:auto}
.fg-inventoryContents .fg-slotGrid{grid-template-columns:repeat(auto-fill,minmax(72px,84px))}
.fg-play{display:flex;gap:12px;flex-wrap:wrap;align-items:stretch}
.fg-playCard{flex:1 1 260px;min-width:0;display:flex;flex-direction:column;gap:8px;padding:12px 14px;border-radius:16px;border:1px solid var(--dsw-alias-border-l1);background:linear-gradient(150deg,var(--dsw-alias-bg-layer-1),var(--dsw-alias-bg-layer-2))}
.fg-playHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px}
.fg-dailyDots{display:flex;gap:6px;margin:0;padding:0;list-style:none}
.fg-dailyDot{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 0;border-radius:10px;border:1px solid var(--dsw-alias-border-l1);font-size:.75em;color:var(--dsw-alias-label-secondary)}
.fg-dailyDot svg{width:18px;height:18px}
.fg-dailyDot[data-state="done"]{background:var(--dsw-alias-state-success-primary);color:#fff;border-color:transparent}
.fg-dailyDot[data-state="today"]{border-color:var(--fg-r-spirit);box-shadow:0 0 0 2px #d4af3755;color:var(--dsw-alias-label-primary);font-weight:700}
.fg-quest{display:grid;grid-template-columns:minmax(0,1fr) 70px auto;align-items:center;gap:8px;font-size:.92em}
.fg-quest progress{width:100%;height:8px;accent-color:var(--dsw-alias-state-success-primary)}
.fg-quest[data-done="true"] .fg-questName{font-weight:600}
.fg-gift{appearance:none;font:inherit;cursor:pointer;flex:0 0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;padding:10px 18px;border-radius:16px;border:2px solid var(--fg-r-spirit);background:#d4af371f;color:var(--dsw-alias-label-primary)}
.fg-giftBox{font-size:2em;line-height:1.1;animation:fg-wiggle 1.6s ease-in-out infinite}
@keyframes fg-wiggle{0%,100%{transform:rotate(-7deg)}50%{transform:rotate(7deg) scale(1.08)}}
.fg-away{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:14px;border:1px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-1);animation:fg-pop .3s ease}
.fg-away .fg-btn{margin-left:auto}
@media(max-width:650px){.fg-bagBody{grid-template-columns:1fr}.fg-bagDetail{flex-direction:row;flex-wrap:wrap;text-align:left}.fg-bagDetailArt{width:84px;height:84px}.fg-bagDetailArt svg{width:80px;height:80px}}
@media (prefers-reduced-motion:reduce){.fg-plot,.fg-slot,.fg-giftBox,.fg-away,.fg-view .fg-toast[data-show=true]{animation:none!important}.fg-view .fg-btn,.fg-plot,button.fg-slot{transition:none}}
` + EXTRA_CSS
