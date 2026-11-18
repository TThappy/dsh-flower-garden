
    // §7c Region themes, readable primary buttons, hotbar, skill tree and task chips.
    const EXTRA_CSS = `
.fg-view{--fg-accent:#2f9e5b;--fg-accent-soft:#2f9e5b1f}
.fg-view[data-scene="meadow"]{--fg-accent:#3f9e5a;--fg-accent-soft:#3f9e5a22}
.fg-view[data-scene="snow"]{--fg-accent:#3f83d0;--fg-accent-soft:#3f83d022}
.fg-view[data-scene="volcano"]{--fg-accent:#cf4f36;--fg-accent-soft:#cf4f3622}
.fg-view[data-scene="lake"]{--fg-accent:#23909c;--fg-accent-soft:#23909c22}
.fg-view[data-scene="woodland"]{--fg-accent:#5a8436;--fg-accent-soft:#5a843622}
.fg-view[data-scene="desert"]{--fg-accent:#b9781f;--fg-accent-soft:#b9781f22}
.fg-view .fg-topbar{background:linear-gradient(180deg,var(--fg-accent-soft),var(--dsw-alias-bg-base) 75%)}
.fg-view .fg-tab[aria-selected="true"]{border-bottom-color:var(--fg-accent);color:var(--dsw-alias-label-primary);font-weight:600}
.fg-view .fg-btnPrimary,.fg-view .fg-btnPrimary:hover:not(:disabled),.fg-view .fg-btnPrimary:focus-visible{background:var(--fg-accent);color:#fff;border-color:transparent}
.fg-view .fg-btnPrimary:hover:not(:disabled){filter:brightness(1.1)}
.fg-view .fg-btnDanger:hover:not(:disabled){background:var(--dsw-alias-state-error-primary);color:#fff}
.fg-view .fg-playCard{border-color:var(--fg-accent-soft)}
.fg-view .fg-dailyDot[data-state="done"]{background:var(--fg-accent)}
.fg-view .fg-quest progress,.fg-view .fg-meterFill{accent-color:var(--fg-accent)}
.fg-view .fg-toast[data-show=true][data-tone="gold"]{border-color:#d4af37;box-shadow:0 0 0 2px #d4af3733,0 6px 20px #0002}
.fg-fly{position:fixed;z-index:2147483000;pointer-events:none;font-size:26px;line-height:1;margin:-13px 0 0 -13px}
.fg-hotbar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;width:fit-content;max-width:100%;padding:8px 12px;border-radius:16px;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-l1);box-shadow:0 4px 14px #0002}
.fg-hotSlot{width:56px;flex:none;cursor:grab}
.fg-hotSlot:active{cursor:grabbing}
.fg-hotSlot .fg-slotArt svg{width:30px;height:30px}
.fg-hotHint{font-size:.85em;color:var(--dsw-alias-label-secondary)}
.fg-plot[data-target="true"]{outline:2px dashed #d4af37;outline-offset:2px;cursor:copy}
.fg-skillTree{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,220px),1fr));gap:12px;margin-top:12px}
.fg-skillBranch{display:flex;flex-direction:column;align-items:center;gap:10px;padding:16px 14px;border-radius:18px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);text-align:center}
.fg-skillNodes{display:flex;align-items:center;padding-bottom:8px}
.fg-skillNode{appearance:none;font:inherit;position:relative;width:54px;height:54px;border-radius:50%;border:3px solid var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-secondary);font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center}
.fg-skillNode+.fg-skillNode{margin-left:46px}
.fg-skillNode+.fg-skillNode::before{content:"";position:absolute;right:100%;top:50%;width:46px;height:4px;margin-right:3px;background:var(--dsw-alias-border-l2);transform:translateY(-50%)}
.fg-skillNode[data-state="done"]{background:var(--fg-accent);border-color:var(--fg-accent);color:#fff;cursor:default;opacity:1}
.fg-skillNode[data-state="done"]+.fg-skillNode::before{background:var(--fg-accent)}
.fg-skillNode[data-state="next"]{border-color:#d4af37;color:var(--dsw-alias-label-primary)}
.fg-skillNode[data-state="next"]:not(:disabled){animation:fg-ready 2.4s ease-in-out infinite}
.fg-skillNode[data-state="confirm"]{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary)}
.fg-skillNode[data-state="closed"],.fg-skillNode[data-state="next"]:disabled{opacity:.55;cursor:not-allowed}
.fg-skillCost{position:absolute;bottom:-10px;padding:0 7px;border-radius:999px;background:#d4af37;color:#241b07;font-size:.72em;line-height:1.5}
.fg-view .fg-ecoProject{border-radius:18px;border-left:5px solid var(--fg-accent)}
.fg-ecoProject progress{width:100%;height:8px;accent-color:var(--fg-accent)}
.fg-questChip{display:inline-flex;align-items:center;gap:4px;padding:.1em .7em;border-radius:999px;border:1px solid var(--dsw-alias-border-l1);font-size:.85em;color:var(--dsw-alias-label-secondary)}
.fg-questChip[data-done="true"]{background:var(--fg-accent-soft);border-color:var(--fg-accent);color:var(--dsw-alias-label-primary)}
.fg-questChip[data-tone="gold"]{border-color:#d4af37;color:var(--dsw-alias-label-primary)}
@media (prefers-reduced-motion:reduce){.fg-skillNode{animation:none!important}}
.fg-gardenBar{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg-gardenBar:empty{display:none}
.fg-gardenBar .fg-sectionOk{padding:.25em .9em;border-radius:999px;background:var(--dsw-alias-bg-layer-1)}
.fg-gardenBar .fg-headAction{margin-left:0}
.fg-arrange{padding:18px;border-radius:20px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-arrangeBody{display:grid;grid-template-columns:260px minmax(0,1fr);gap:18px;align-items:start}
.fg-vaseCard{display:flex;flex-direction:column;align-items:center;gap:10px;padding:14px;border-radius:18px;background:linear-gradient(180deg,var(--fg-accent-soft),var(--dsw-alias-bg-layer-2))}
.fg-vase{position:relative;width:230px;height:210px}
.fg-vaseStem{appearance:none;position:absolute;left:50%;bottom:52px;width:92px;height:118px;margin-left:-46px;padding:0;border:0;background:transparent;cursor:pointer;transform-origin:50% 100%;transition:filter .12s ease}
.fg-vaseStem:hover{filter:brightness(1.12) drop-shadow(0 0 6px #d4af37)}
.fg-vaseStem svg{width:92px;height:118px;overflow:visible}
.fg-vasePot{position:absolute;left:50%;bottom:0;width:78px;height:74px;margin-left:-39px;border-radius:14px 14px 30px 30px;background:linear-gradient(90deg,#7fb2c9,#b7dbe8 45%,#6fa0b8);box-shadow:inset 0 8px 0 #ffffff55,0 6px 14px #0003}
.fg-vaseStars{font-size:1.5em;letter-spacing:.12em;color:#d4af37;line-height:1}
.fg-vaseStars[data-stars="0"]{color:var(--dsw-alias-border-l2)}
.fg-vaseStars[data-stars="5"]{text-shadow:0 0 12px #d4af3799}
.fg-bond{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:18px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-bondGuests{display:flex;gap:8px;flex-wrap:wrap}
.fg-bondGuest{appearance:none;font:inherit;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 10px;border-radius:14px;border:2px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);color:inherit}
.fg-bondGuest[aria-pressed="true"]{border-color:var(--fg-accent);background:var(--fg-accent-soft)}
.fg-bondArt{display:inline-flex;width:40px;height:40px}.fg-bondArt svg{width:40px;height:40px}
.fg-hearts{color:#e2557a;font-size:.85em;letter-spacing:.05em;white-space:nowrap}
.fg-bondDetail{display:grid;grid-template-columns:minmax(0,300px) minmax(0,1fr);gap:16px;align-items:start}
.fg-bondInfo,.fg-bondGift{display:flex;flex-direction:column;gap:8px;min-width:0;align-items:flex-start}
.fg-bondGift .fg-slotGrid{width:100%}
.fg-bondInfo progress{width:100%;height:8px;accent-color:#e2557a}
.fg-questChip .fg-dot{vertical-align:middle}
@media(max-width:650px){.fg-arrangeBody,.fg-bondDetail{grid-template-columns:1fr}.fg-vaseCard{width:100%;box-sizing:border-box}}
.fg-genes{display:grid;grid-template-columns:auto auto auto;gap:4px 8px;align-items:center;justify-content:start;font-size:.85em}
.fg-geneName,.fg-geneEnd{color:var(--dsw-alias-label-secondary)}
.fg-genePips{display:inline-flex;gap:3px}
.fg-genePips i{display:block;width:13px;height:8px;border-radius:3px;background:var(--dsw-alias-border-l1)}
.fg-genePips i[data-on="true"]{background:var(--fg-accent)}
.fg-geneCard{display:flex;flex-direction:column;align-items:flex-start;gap:8px;padding:10px 12px;border-radius:12px;background:var(--dsw-alias-bg-layer-2)}
.fg-geneHead{display:flex;align-items:center;gap:8px}
.fg-kinTree{display:flex;flex-direction:column;align-items:center;gap:4px}
.fg-kinParents{display:flex;align-items:flex-start;gap:10px;padding-top:6px;border-top:2px solid var(--dsw-alias-border-l2)}
.fg-kin{display:flex;flex-direction:column;align-items:center;gap:1px;font-size:.75em;line-height:1.3;color:var(--dsw-alias-label-secondary);text-align:center}
.fg-kinArt{display:inline-flex;width:44px;height:44px}.fg-kinArt svg{width:44px;height:44px;overflow:visible}
.fg-crossHint{display:flex;align-items:center;gap:4px;flex-wrap:wrap}
.fg-crossHint .fg-questChip{font-size:.75em}
.fg-goalGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,210px),1fr));gap:10px}
.fg-goal{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:12px;border-radius:14px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-goal[data-done="true"]{border-color:#d4af37;background:#d4af371a}
.fg-bagDetail .fg-genes{text-align:left}
.fg-seasonChip{display:inline-flex;align-items:center;padding:.1em .8em;border-radius:999px;border:1px solid var(--fg-accent);background:var(--fg-accent-soft);font-size:.88em;color:var(--dsw-alias-label-primary)}
.fg-vasePot{width:80px;height:76px;margin-left:-40px;background:none;box-shadow:none;border-radius:0;filter:drop-shadow(0 6px 8px #0003)}
.fg-vaseStill .fg-vaseStem{pointer-events:none;cursor:default}
.fg-vasePicker{display:flex;gap:6px;flex-wrap:wrap;justify-content:center}
.fg-vaseChoice{appearance:none;cursor:pointer;width:46px;height:46px;padding:4px;border-radius:12px;border:2px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);display:flex;align-items:center;justify-content:center}
.fg-vaseChoice svg{width:34px;height:32px}
.fg-vaseChoice[aria-pressed="true"]{border-color:var(--fg-accent);background:var(--fg-accent-soft)}
.fg-vaseChoice:disabled{cursor:not-allowed;opacity:.4;filter:grayscale(1)}
.fg-album,.fg-trip{padding:18px;border-radius:20px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-cardGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(164px,1fr));gap:12px}
.fg-keepCard{position:relative;display:flex;flex-direction:column;align-items:center;gap:5px;padding:14px 10px 10px;border-radius:16px;border:2px solid var(--dsw-alias-border-l1);background:linear-gradient(180deg,#fffdf6,#f3efe2);color:#2a2a22;box-shadow:0 4px 12px #0002;text-align:center}
.fg-keepCard .fg-note{color:#6b6a5c}
.fg-keepCard[data-stars="5"],.fg-keepCard[data-rarity="spirit"]{border-color:#d4af37;box-shadow:0 0 18px #d4af3755}
.fg-keepCard[data-rarity="alt"]{border-color:var(--fg-r-alt)}.fg-keepCard[data-rarity="hybrid"]{border-color:var(--fg-r-hybrid)}.fg-keepCard[data-rarity="curio"]{border-color:var(--fg-r-curio)}
.fg-cardVase{width:138px;height:126px}
.fg-cardVase .fg-vase{transform:scale(.6);transform-origin:0 0}
.fg-cardFlower{width:110px;height:110px;display:flex;align-items:center;justify-content:center}.fg-cardFlower svg{width:106px;height:106px;overflow:visible}
.fg-keepCard .fg-genes{font-size:.72em}.fg-keepCard .fg-geneName,.fg-keepCard .fg-geneEnd{color:#6b6a5c}
.fg-cardDel{appearance:none;position:absolute;top:4px;right:4px;width:22px;height:22px;border-radius:50%;border:0;background:#0000001a;color:#2a2a22;cursor:pointer;font:inherit;line-height:1;opacity:.45}
.fg-cardDel:hover,.fg-cardDel[data-armed="true"]{opacity:1}
.fg-cardDel[data-armed="true"]{background:var(--dsw-alias-state-error-primary);color:#fff}
.fg-tripRow{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg-tripRow progress{flex:1 1 160px;height:10px;accent-color:var(--fg-accent)}
.fg-vaseChoice{position:relative}
.fg-vasePrice{position:absolute;left:50%;bottom:-9px;transform:translateX(-50%);padding:0 5px;border-radius:999px;background:#d4af37;color:#241b07;font-size:.62em;line-height:1.5;white-space:nowrap}
.fg-vaseChoice[data-armed="true"]{border-color:var(--dsw-alias-state-error-primary)}
.fg-vaseChoice[data-earned="true"][data-owned="false"]:not(:disabled){opacity:1;filter:none}
.fg-vasePicker{padding-bottom:8px}
.fg-shelf{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:10px 12px;border-radius:14px;border:1px solid #d4af3766;background:linear-gradient(180deg,#d4af3714,transparent)}
.fg-shelfCompact{padding:6px 10px}
.fg-shelfCard{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;width:74px;height:74px;border-radius:12px;border:2px solid #d4af37;background:#fffdf6;color:#2a2a22;font-size:.68em;text-align:center}
.fg-shelfCard svg{width:40px;height:40px;overflow:visible}
.fg-shelfStars{color:#d4af37;font-size:1.3em;line-height:1.6}
.fg-shelfFx{line-height:1.2;color:#6b6a5c}
.fg-shelfEmpty{border-style:dashed;border-color:var(--dsw-alias-border-l2);background:transparent;color:var(--dsw-alias-label-secondary)}
.fg-cardTools{display:flex;flex-direction:column;align-items:center;gap:5px;width:100%}
.fg-cardToolRow{display:flex;gap:6px}
.fg-cardTool{appearance:none;font:inherit;cursor:pointer;width:28px;height:28px;border-radius:50%;border:1px solid #cfc8b4;background:#fff;color:#2a2a22;line-height:1}
.fg-cardTool:hover{border-color:#d4af37}
.fg-cardTool[aria-pressed="true"]{background:#d4af37;border-color:#d4af37}
.fg-cardEdit{display:flex;flex-direction:column;gap:4px;width:100%}
.fg-cardEdit input{font:inherit;font-size:.85em;padding:.3em .5em;border-radius:8px;border:1px solid #cfc8b4;background:#fff;color:#2a2a22;min-width:0}
.fg-cardInscription{display:flex;flex-direction:column;gap:1px;font-size:.85em;line-height:1.35;overflow-wrap:anywhere}
.fg-cardInscription span{color:#6b6a5c;font-style:italic}
.fg-work,.fg-contest,.fg-legacy{padding:18px;border-radius:20px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-workNew{display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.fg-workNew .fg-bagFilters{padding:0}.fg-workNew .fg-slotGrid{width:100%}
.fg-pages{display:flex;flex-direction:column;gap:10px}
.fg-goal progress{width:100%;height:8px;accent-color:var(--fg-accent)}
.fg-fund{padding:18px;border-radius:20px;border:1px solid #d4af3766;background:linear-gradient(180deg,#d4af3714,var(--dsw-alias-bg-layer-1))}
.fg-view .fg-tabs{gap:6px;padding:8px 0;flex-wrap:wrap;overflow-x:visible}
.fg-view .fg-toolbar{align-items:flex-start;flex-wrap:wrap}
.fg-view .fg-topbar{max-height:none}
@media(max-width:650px){.fg-view .fg-tabs{flex-wrap:nowrap;overflow-x:auto}.fg-view .fg-topbar{max-height:48%}}
.fg-view .fg-tab{display:inline-flex;align-items:center;gap:.4em;padding:.45em .95em;border:1px solid transparent;border-radius:999px;transition:background .12s ease,color .12s ease}
.fg-view .fg-tab:hover{background:var(--fg-accent-soft);color:var(--dsw-alias-label-primary)}
.fg-view .fg-tab[aria-selected="true"]{background:var(--fg-accent);color:#fff;border-color:transparent;font-weight:600;box-shadow:0 3px 10px #0002}
.fg-tabIcon{font-size:1.05em;line-height:1}
.fg-view .fg-tabPanel>.fg-section:not(.fg-ground){padding:18px;border-radius:20px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1);box-shadow:0 2px 10px #0000000d}
.fg-view .fg-sectionTitle{font-size:1.08em}
.fg-pals{display:flex;flex-direction:column;gap:12px;padding:16px;border-radius:18px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-layer-1)}
.fg-palGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,190px),1fr));gap:10px}
.fg-pal{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border-radius:16px;border:2px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base);text-align:center}
.fg-pal[data-home="true"]{border-color:var(--fg-accent);background:linear-gradient(180deg,var(--fg-accent-soft),var(--dsw-alias-bg-base))}
.fg-palArt{display:inline-flex;width:56px;height:56px}.fg-palArt svg{width:56px;height:56px}
.fg-event{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg-eventGo{appearance:none;font:inherit;cursor:pointer;display:inline-flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 18px;border-radius:999px;border:2px solid #d4af37;background:linear-gradient(90deg,#d4af3733,#8f7be022,#4fa3d822);color:var(--dsw-alias-label-primary);animation:fg-ready 2.4s ease-in-out infinite}
.fg-eventIcon{font-size:1.6em;line-height:1;animation:fg-wiggle 1.6s ease-in-out infinite}
.fg-brief{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-radius:14px;border:1px dashed var(--dsw-alias-border-l2);background:var(--dsw-alias-bg-base);font-size:.95em}
.fg-brief[data-brief="met"]{border:1px solid #d4af37;background:#d4af371a}
.fg-brief[data-brief="done"]{opacity:.65}
.fg-greet{padding-top:4px;border-top:1px dashed #cfc8b4}
@media (prefers-reduced-motion:reduce){.fg-eventGo,.fg-eventIcon{animation:none!important}}
.fg-wantGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:12px}
.fg-want{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 10px;border-radius:16px;border:2px dashed var(--fg-accent);background:var(--dsw-alias-bg-base);text-align:center}
.fg-want[data-done="true"]{border-style:solid;border-color:#d4af37;background:#d4af371a}
.fg-wantArt{display:inline-flex;width:84px;height:84px}.fg-wantArt svg{width:84px;height:84px;overflow:visible}
.fg-view[data-scene="alpine"]{--fg-accent:#4a78c8;--fg-accent-soft:#4a78c822}
.fg-view[data-scene="rainforest"]{--fg-accent:#1f8a62;--fg-accent-soft:#1f8a6222}
.fg-view[data-scene="coast"]{--fg-accent:#2f8fb8;--fg-accent-soft:#2f8fb822}
.fg-view[data-scene="garden"]{--fg-accent:#c2506e;--fg-accent-soft:#c2506e22}
.fg-miniTools{flex-wrap:wrap}
.fg-miniToday{display:flex;flex-wrap:wrap;align-items:center;gap:6px;padding:0 12px 10px}
.fg-miniToday .fg-questChip{font-size:.85em}
.fg-miniNotice{position:sticky;bottom:0;margin:0;padding:6px 12px;background:var(--dsw-alias-bg-layer-1);font-weight:600;color:var(--fg-accent)}
.fg-miniNotice:empty{display:none}
.fg-cardWarn{position:absolute;inset:0;z-index:2;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:14px;border-radius:14px;background:#fffdf6f2;color:#2a2a22;text-align:center;line-height:1.5}
.fg-cardWarn strong{color:var(--dsw-alias-state-error-primary);font-size:1.05em}
.fg-cardWarn span{font-size:.88em}
.fg-cardWarnActions{display:flex;gap:8px;flex-wrap:wrap;justify-content:center}
.fg-cardDel[data-armed="true"]{z-index:3}
.fg-vaseShelf{display:flex;flex-direction:column;gap:6px;width:100%}
.fg-vasePicker{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding-bottom:0}
.fg-vaseChoice{width:auto;height:auto;flex-direction:column;gap:2px;padding:6px 2px 5px;color:var(--dsw-alias-label-primary);font:inherit;min-width:0}
.fg-vaseChoice svg{width:46px;height:44px}
.fg-vaseChoice:disabled{opacity:1;filter:none}
.fg-vaseChoice:disabled svg{filter:grayscale(1);opacity:.45}
.fg-vaseName{font-size:.74em;font-weight:600;line-height:1.2}
.fg-vaseState{display:inline-flex;align-items:center;justify-content:center;gap:3px;flex-wrap:wrap;font-size:.64em;line-height:1.25;color:var(--dsw-alias-label-secondary);text-align:center}
.fg-vaseChoice[data-owned="true"] .fg-vaseState{color:var(--fg-accent);font-weight:600}
.fg-vasePrice{position:static;transform:none;padding:0;background:none;color:#a67c12;font-size:1.1em;font-weight:700}
.fg-vaseHint{margin:0;font-size:.8em;line-height:1.5;text-align:center;color:var(--dsw-alias-label-secondary)}
.fg-vasePot{filter:drop-shadow(0 4px 5px #0002)}
.fg-goods{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,200px),1fr));gap:10px}
.fg-good{display:flex;flex-direction:column;align-items:flex-start;gap:4px;padding:12px;border-radius:14px;border:1px solid var(--dsw-alias-border-l1);background:var(--dsw-alias-bg-base)}
.fg-good[data-have="false"]{opacity:.6}
.fg-goodsIcon{font-size:1.7em;line-height:1}
.fg-slotArt .fg-goodsIcon{font-size:2em}
.fg-vaseTints{display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap}
.fg-vaseTint{appearance:none;width:22px;height:22px;padding:0;border-radius:50%;border:2px solid var(--dsw-alias-border-l2);cursor:pointer}
.fg-vaseTint[aria-pressed="true"]{outline:2px solid var(--fg-accent);outline-offset:2px}
.fg-vaseTintPick{appearance:none;width:30px;height:26px;padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:none;cursor:pointer}
`
