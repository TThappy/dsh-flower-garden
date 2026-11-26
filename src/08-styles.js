    // ---------------------------------------------------------------------
    // §7 Stylesheet. Rendered as a React element so unmounting the view
    //    removes it; only `--dsw-alias-*` tokens carry furniture colors.
    // ---------------------------------------------------------------------
    const BASE_CSS = `
.fg-flowerLiving>.fg-plant{filter:saturate(1.16) drop-shadow(0 1px 1px #203b2326)}
.fg-flowerSpecimen{filter:saturate(.72);opacity:.9}

.fg-dialog.fg-rewardDialog{--fg-reward-gold:#c89b2b;width:min(620px,calc(100vw - 28px));border:2px solid var(--fg-reward-gold);background:var(--dsw-alias-bg-layer-1);box-shadow:0 0 60px #d4af3733,0 24px 100px #0006}
.fg-dialog.fg-rewardDialog::backdrop{background:#151008b8;backdrop-filter:blur(7px)}
.fg-rewardHead{text-align:center;padding:28px 24px 20px;background:linear-gradient(145deg,#d4af372b,transparent);border-bottom:1px solid var(--fg-reward-gold)}
.fg-rewardHead h2{margin:6px 0;font-size:1.7em;line-height:1.4;color:var(--dsw-alias-label-primary)}
.fg-rewardHead p{margin:8px 0 0;color:var(--dsw-alias-label-secondary);line-height:1.6}
.fg-rewardStar{display:block;font-size:3.4em;color:#d4af37;line-height:1.1;text-shadow:0 0 24px #d4af3766}
.fg-rewardList{padding:22px;display:flex;flex-direction:column;gap:12px}
.fg-rewardItem{display:flex;align-items:center;gap:14px;padding:16px;border:1px solid var(--fg-reward-gold);border-radius:14px;background:linear-gradient(100deg,#d4af3712,transparent)}
.fg-rewardItem>div{min-width:0;flex:1}.fg-rewardItem h3{margin:0;font-size:1.1em;line-height:1.5}.fg-rewardItem p{margin:5px 0 0;line-height:1.6}
.fg-rewardAmount{font-size:1.3em;color:var(--fg-reward-gold);white-space:normal;text-align:right;max-width:42%;overflow-wrap:anywhere}
.fg-rewardBalance{padding:0 22px;margin:0 0 18px;line-height:1.7;text-align:center;color:var(--dsw-alias-label-secondary)}
.fg-rewardActions{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:10px;padding:0 22px 24px}
.fg-rewardConfirm{background:#d4af37!important;color:#241b07!important;border-color:#d4af37!important;font-weight:700}
.fg-bagButton{flex:none;border-color:#c89b2b!important}.fg-inventoryDialog{width:min(780px,calc(100vw - 28px))}
.fg-inventoryHead{display:flex;align-items:center;justify-content:space-between;padding:20px 24px 0;gap:16px}.fg-inventoryHead h2{margin:0;line-height:1.5}
.fg-inventoryContents{padding:18px 24px 24px}.fg-inventorySection .fg-inventoryContents{padding:0}
.fg-inventoryGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr));gap:12px;margin-top:14px}
.fg-inventoryItem{display:flex;align-items:flex-start;gap:14px;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:var(--dsw-alias-bg-base)}
.fg-inventoryItem>div{min-width:0;flex:1}.fg-inventoryItem h3{font-size:1.05em;margin:0 0 6px;line-height:1.5}.fg-inventoryItem p{margin:6px 0 0;font-size:.9em;line-height:1.7}
.fg-inventoryIcon{display:flex;align-items:center;justify-content:center;flex:0 0 44px;width:44px;height:44px;border-radius:12px;background:#d4af371c;color:#c89b2b;font-size:1.7em}.fg-inventoryIcon svg{width:34px;height:34px}
.fg-inventoryCount{font-size:1.3em;font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary)}
@media(max-width:480px){.fg-rewardItem{flex-wrap:wrap}.fg-rewardAmount{max-width:100%;margin-left:auto}.fg-rewardHead{padding:22px 16px}.fg-rewardList{padding:16px}.fg-inventoryContents{padding:16px}.fg-rewardActions .fg-btn{flex:1}}

.fg-discoveryDialog{width:min(780px,calc(100vw - 28px))}
.fg-discoveryHead{padding:24px 26px 16px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.fg-discoveryHead h2{margin:10px 0;font-size:1.6em;line-height:1.4}
.fg-discoveryHead time{font-size:.8em;color:var(--dsw-alias-label-secondary)}
.fg-discoveryList{display:flex;flex-direction:column;gap:16px;padding:20px 26px}
.fg-discoveryItem{display:flex;align-items:center;gap:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;padding:14px;background:var(--dsw-alias-bg-layer-2)}
.fg-discoveryArt{flex:0 0 150px;width:150px;height:150px;display:flex;align-items:center;justify-content:center;background:radial-gradient(ellipse,#f3edcf,#d9e4d6);border-radius:14px}
.fg-discoveryArt svg{width:140px;height:140px}
.fg-discoveryCopy{min-width:0;display:flex;flex-direction:column;gap:8px}
.fg-discoveryCopy h3{margin:0;font-size:1.3em;line-height:1.5}
.fg-discoveryCopy p{margin:0;line-height:1.7}
.fg-discoveryFooter{padding:0 26px 24px;display:flex;justify-content:flex-end}
.fg-discoveryHistory{display:flex;flex-direction:column;gap:8px;max-height:380px;overflow:auto}
.fg-regionCards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}
.fg-regionCard{display:flex;flex-direction:column;gap:9px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;padding:10px;min-width:0}
.fg-regionCard[data-current=true]{border-color:var(--dsw-alias-state-success-primary)}
.fg-regionCard .fg-panorama{height:90px;border-radius:9px}
.fg-regionCard h3{margin:0;font-size:1em}
.fg-view .fg-toast[data-show=true]{padding:12px 18px;border:1px solid var(--dsw-alias-border-l2);border-radius:12px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-size:1em;line-height:1.6;box-shadow:0 4px 16px #0002;margin:0}
@media(max-width:550px){.fg-discoveryItem{flex-direction:column;align-items:stretch}.fg-discoveryArt{align-self:center}.fg-latestDiscovery{max-width:100px}}

.fg-view [hidden]{display:none!important}
.fg-view{font-family:var(--fg-font-family,system-ui);font-size:var(--fg-font-size,15px)}
.fg-view button,.fg-view input,.fg-view select,.fg-view dialog{font-family:inherit}
.fg-topbar{flex:none;max-height:42%;overflow:auto;padding:14px 24px 0;background:var(--dsw-alias-bg-base);border-bottom:1px solid var(--dsw-alias-border-l1);z-index:3}
.fg-toolbar{display:flex;align-items:center;gap:12px;min-width:0}
@media(max-width:650px){.fg-toolbar{flex-wrap:wrap;gap:8px;padding-bottom:8px}.fg-toolbar .fg-tabs{order:-1;flex:1 0 100%}.fg-toolbar .fg-quickSize{margin-left:auto}}
.fg-tabs{display:flex;gap:3px;overflow-x:auto;min-width:0;flex:1;scrollbar-width:thin;padding:8px 0 0}
.fg-tab{flex:none;border:0;border-bottom:3px solid transparent;background:transparent;color:var(--dsw-alias-label-secondary);font-size:.9em;padding:12px 10px;cursor:pointer;white-space:nowrap}
.fg-tab[aria-selected=true]{border-bottom-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-label-primary);font-weight:650}
.fg-tab:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:-3px}
.fg-quickSize{display:flex;align-items:center;gap:6px;font-size:.8em;white-space:nowrap}
.fg-quickSize select{background:var(--dsw-alias-bg-layer-1);color:inherit;border:1px solid var(--dsw-alias-border-l1);border-radius:7px;padding:5px;font-size:inherit}
.fg-tabPanel{display:flex;flex-direction:column;gap:20px;outline:none}
.fg-tabPanel:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:3px}
.fg-liveClock{display:grid;grid-template-columns:auto auto;gap:1px 8px;align-items:center;font-variant-numeric:tabular-nums;font-size:.85em}
.fg-liveClock strong{font-size:1.15em;font-weight:600;letter-spacing:.04em}
.fg-liveClock small{grid-column:1/-1;font-size:.78em;color:var(--dsw-alias-label-secondary)}
.fg-settings{max-width:640px;padding:20px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px}
.fg-settingRow{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:10px 0}
.fg-petSizeRow{flex-wrap:wrap;gap:8px 16px}
.fg-petSizeLabel{display:flex;align-items:center;gap:10px;flex:1 1 220px;min-width:0;flex-wrap:wrap}
.fg-petSizeLabel input{flex:1 1 90px;min-width:65px;max-width:240px;min-height:28px;accent-color:var(--fg-accent)}
.fg-petSizeValue{min-width:4ch;text-align:end;font-variant-numeric:tabular-nums}
.fg-fontPreview{font-size:1.25em;line-height:1.8;padding:22px;border-radius:12px;background:var(--dsw-alias-bg-layer-2)}
.fg-ground.fg-landscape{position:relative;isolation:isolate;overflow:hidden;border-radius:18px;min-height:580px;padding:0;background:#233d43;gap:0}
.fg-gardenBackdrop{position:absolute;inset:0;z-index:0;pointer-events:none}
.fg-gardenBackdrop .fg-panorama{height:clamp(420px,75vw,900px);mask-image:linear-gradient(#000 85%,transparent 100%)}
.fg-gardenContent{position:relative;z-index:1;display:flex;flex-direction:column;gap:18px;padding:24px}
.fg-gardenHeading{display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:18px;min-height:100px}
.fg-gardenHeading .fg-landscapeCaption,.fg-gardenHeading .fg-landscapeTime{position:static}
.fg-gardenHeading .fg-landscapeTime{margin-left:auto}
.fg-gardenControls{display:flex;flex-direction:column;gap:10px;padding:16px;border:1px solid var(--dsw-alias-border-l2);border-radius:14px;background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 92%,transparent)}
.fg-gardenContent .fg-plot{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 82%,transparent);backdrop-filter:blur(3px)}
.fg-gardenContent .fg-plot[data-state=locked]{background:color-mix(in srgb,var(--dsw-alias-bg-layer-1) 70%,transparent)}
@media(max-width:650px){.fg-gardenContent{padding:14px;gap:14px}.fg-gardenHeading{min-height:100px}.fg-gardenControls{padding:12px}.fg-gardenHeading .fg-landscapeTime{align-items:flex-start;margin-left:0}}
.fg-panorama{display:block;width:100%;height:100%}
.fg-landscape::after{content:'';position:absolute;inset:0;z-index:0;background:linear-gradient(90deg,#091c2490,transparent 60%),linear-gradient(0deg,#071a2860,transparent 50%);pointer-events:none}
.fg-landscapeCaption{position:absolute;z-index:1;left:26px;top:24px;display:flex;flex-direction:column;gap:8px;color:#fff9e9;text-shadow:0 2px 8px #10222b}
.fg-landscapeCaption strong{font-size:2em;line-height:1.3;font-weight:500}
.fg-landscapeCaption span{font-size:.9em}
.fg-landscapeTime{position:absolute;z-index:1;right:22px;bottom:20px;display:flex;flex-direction:column;gap:6px;align-items:flex-end;color:#fff9e9;text-shadow:0 2px 8px #10222b;font-variant-numeric:tabular-nums}
.fg-landscapeTime strong{font-size:1.6em;font-weight:500;letter-spacing:.04em}
.fg-landscapeTime span{font-size:.75em}
.fg-view .fg-btn{height:auto;min-height:2em;line-height:1.3;padding-top:.4em;padding-bottom:.4em;white-space:normal}
.fg-view .fg-variant{height:auto;min-height:1.6em;line-height:1.4;padding-top:.15em;padding-bottom:.15em}
.fg-view .fg-sceneChip{height:auto;min-height:2em;padding-top:.35em;padding-bottom:.35em}
.fg-view .fg-chip{height:auto;min-height:1.9em}
.fg-view .fg-seed,.fg-view .fg-bloom{height:auto;min-height:2em;padding-top:.35em;padding-bottom:.35em}
.fg-view .fg-note,.fg-view .fg-itemNote{white-space:normal}
@media(max-width:650px){.fg-topbar{padding:10px 12px 0}.fg-view .fg-scroll{padding:12px}.fg-topbar .fg-sub{display:none}.fg-topbar .fg-header{gap:8px}.fg-quickSize{font-size:.7em}.fg-landscapeCaption{left:18px;top:18px}.fg-landscapeTime{right:16px;bottom:14px}}

.fg-ecology{padding:18px;border:1px solid var(--dsw-alias-border-l2);border-radius:20px;background:var(--dsw-alias-bg-layer-1)}
.fg-ecoLead{margin:0;font-size:calc(var(--fg-font-size,15px) * 1.3846);line-height:1.6;font-weight:600}
.fg-ecoDetails>summary{padding:10px 0;cursor:pointer;font-size:calc(var(--fg-font-size,15px) * 1.0);font-weight:600}
.fg-ecoProjects{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,240px),1fr));gap:12px;margin-top:12px}
.fg-ecoProject{display:flex;flex-direction:column;gap:8px;padding:16px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-base)}
.fg-ecoProject h3{margin:0 0 4px;font-size:calc(var(--fg-font-size,15px) * 1.0769);line-height:1.6}
.fg-ecoTargets{display:flex;gap:5px;flex-wrap:wrap}
.fg-purpose{display:flex;flex-direction:column;gap:5px;padding:12px;border-left:3px solid var(--dsw-alias-state-success-primary);background:var(--dsw-alias-bg-layer-2);font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:1.6}
.fg-source{font-size:calc(var(--fg-font-size,15px) * 0.9231);color:var(--dsw-alias-brand-primary);text-decoration:underline}
.fg-residentActions{display:flex;flex-wrap:wrap;gap:6px}
.fg-residentActions>.fg-hint{flex-basis:100%}
.fg-notebooks{display:grid;grid-template-columns:repeat(auto-fill,minmax(145px,1fr));gap:8px;margin-top:12px}
.fg-notebook{display:flex;flex-direction:column;gap:6px;align-items:stretch;text-align:left;padding:10px;border:1px solid var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-base);color:inherit;font:inherit;cursor:pointer}
.fg-notebook progress{width:100%;height:5px;accent-color:var(--dsw-alias-state-success-primary)}
.fg-journal{display:flex;flex-direction:column;gap:8px;max-height:250px;overflow:auto}
.fg-journalEntry{display:flex;flex-direction:column;gap:4px;padding:10px;border-bottom:1px solid var(--dsw-alias-border-l1);font-size:calc(var(--fg-font-size,15px) * 0.9231)}
.fg-guestNote strong{font-size:calc(var(--fg-font-size,15px) * 0.9231);color:var(--dsw-alias-label-secondary)}
.fg-guestNote p{margin:3px 0 0;font-size:calc(var(--fg-font-size,15px) * 1.0);line-height:1.7}
.fg-guest{appearance:none;color:inherit;font:inherit;text-align:left;cursor:pointer}
.fg-guest:hover{border-color:var(--dsw-alias-brand-primary)}
.fg-guest:focus-visible,.fg-notebook:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-dialog .fg-visitorPortrait{background:radial-gradient(ellipse,#f5f2d9,#d6e6dd)}
.fg-dialog .fg-visitorPortrait svg{width:210px;height:210px}

.fg-showChoices>summary{cursor:pointer;margin-bottom:12px}
.fg-showChoices>summary::after{content:'⌄';margin-left:8px}
.fg-showChoices[open]>summary::after{transform:rotate(180deg)}
.fg-dialog{box-sizing:border-box;width:min(760px,calc(100vw - 32px));max-height:calc(100dvh - 40px);padding:0;border:1px solid var(--dsw-alias-border-l2);border-radius:24px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);box-shadow:0 24px 100px #0006;overflow:auto}
.fg-dialog::backdrop{background:rgba(12,24,19,.65);backdrop-filter:blur(6px)}
.fg-dialog .fg-preview{border:0;border-radius:0;padding:28px;gap:24px;align-items:center;background:transparent}
.fg-dialog .fg-previewArt{width:260px;height:300px;border-radius:160px 160px 18px 18px;background:radial-gradient(ellipse at 50% 40%,#f9f7e8,#dfe9dc);box-shadow:inset 0 0 0 1px #68826d30}
.fg-dialog .fg-previewArt svg{width:244px;height:244px}
.fg-dialog .fg-note{white-space:normal;overflow:visible}
.fg-dialog .fg-previewBody{gap:12px;flex-basis:260px}
.fg-dialog .fg-previewName{font-size:calc(var(--fg-font-size,15px) * 1.8462);line-height:1.4;font-weight:600}
.fg-dialog .fg-previewLatin{font-family:Georgia,serif;font-size:calc(var(--fg-font-size,15px) * 1.1538);line-height:1.5}
.fg-dialog .fg-previewMeaning{font-size:calc(var(--fg-font-size,15px) * 1.1538);line-height:1.8}
.fg-cardFact{margin:0;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1);font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:1.8;color:var(--dsw-alias-label-secondary)}
.fg-dialog .fg-previewActions{width:100%;flex-direction:row;flex-wrap:wrap;justify-content:flex-end;padding-top:16px;border-top:1px solid var(--dsw-alias-border-l1)}
.fg-archive{grid-column:1/-1;display:flex;flex-direction:column;gap:12px;padding-top:16px;border-top:1px solid var(--dsw-alias-border-l1)}
.fg-archiveGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.fg-archiveEntry{display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px;background:var(--dsw-alias-bg-layer-1);color:inherit;font:inherit;cursor:pointer}
.fg-archiveEntry svg{width:120px;height:120px}
.fg-archiveEntry:hover{background:var(--dsw-alias-bg-layer-2)}
.fg-archiveEntry:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
@media(max-width:600px){.fg-dialog .fg-preview{padding:20px;justify-content:center}.fg-dialog .fg-previewArt{width:200px;height:220px}.fg-dialog .fg-previewArt svg{width:190px;height:190px}.fg-dialog .fg-previewBody{flex-basis:100%}.fg-dialog .fg-previewName{font-size:calc(var(--fg-font-size,15px) * 1.6154)}}

.fg-view{box-sizing:border-box;width:100%;height:100%;flex:1 1 auto;min-height:0;display:flex;flex-direction:column;background:var(--dsw-alias-bg-base);color:var(--dsw-alias-label-primary);font-size:calc(var(--fg-font-size,15px) * 1.0);line-height:calc(var(--fg-font-size,15px) * 1.5385)}
.fg-scroll{box-sizing:border-box;flex:1 1 auto;min-height:0;overflow:auto;display:flex;flex-direction:column;gap:16px;padding:16px 24px 32px}
.fg-header{display:flex;align-items:flex-start;justify-content:space-between;gap:16px;flex-wrap:wrap;padding-bottom:14px;border-bottom:1px solid var(--dsw-alias-border-l1)}
.fg-titleBlock{min-width:0;max-width:520px}
.fg-title{margin:0;font-size:calc(var(--fg-font-size,15px) * 1.2308);line-height:calc(var(--fg-font-size,15px) * 1.8462);font-weight:600}
.fg-sub{margin:2px 0 0;font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);color:var(--dsw-alias-label-secondary)}
.fg-stats{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fg-chip{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1)}
.fg-chipValue{font-size:calc(var(--fg-font-size,15px) * 1.0);font-weight:600;font-variant-numeric:tabular-nums}
.fg-chipKey{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary)}
.fg-xpBar{display:inline-block;width:44px;height:4px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.fg-xpFill{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary)}
.fg-scenes{display:flex;gap:8px;flex-wrap:wrap}
.fg-sceneChip{appearance:none;display:inline-flex;align-items:center;gap:8px;height:30px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:999px;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600;cursor:pointer;transition:border-color .15s ease}
.fg-sceneChip:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-sceneChip[data-active="true"]{box-shadow:inset 0 0 0 1px var(--dsw-alias-label-primary)}
.fg-sceneChipArmed{border-color:var(--dsw-alias-state-error-primary)!important}
.fg-sceneChipArmed .fg-sceneMeta{color:var(--dsw-alias-state-error-primary)}
.fg-sceneChip[data-locked="true"]{opacity:.62;font-weight:500}
.fg-sceneName{white-space:nowrap}
.fg-sceneMeta{font-size:calc(var(--fg-font-size,15px) * 0.7692);font-weight:500;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums;white-space:nowrap}
.fg-hint{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.3077);color:var(--dsw-alias-label-secondary)}
.fg-hintWeather{display:inline-block;margin-left:8px;color:var(--dsw-alias-label-primary)}
.fg-toast{position:sticky;top:0;z-index:1;min-height:18px;margin:0 -24px;padding:2px 24px 2px;font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);color:var(--dsw-alias-state-success-primary)}
.fg-toast[data-show="true"]{background:var(--dsw-alias-bg-base)}
.fg-toast[data-tone="warn"]{color:var(--dsw-alias-state-warn-primary)}
.fg-toast[data-tone="info"]{color:var(--dsw-alias-label-secondary)}
.fg-toast[data-tone="gold"]{color:var(--dsw-alias-state-warn-primary);font-weight:600;display:flex;align-items:center;gap:8px}
.fg-toastArt{display:inline-flex;width:26px;height:26px;flex:none}
.fg-toastArt svg{width:26px;height:26px;overflow:visible}
.fg-section{display:flex;flex-direction:column;gap:10px}
.fg-ground{padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:16px}
.fg-sectionHead{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.fg-sectionTitle{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);font-weight:600;letter-spacing:.02em}
.fg-sectionMeta{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-sectionWarn{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-state-warn-primary)}
.fg-sectionOk{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-state-success-primary)}
.fg-items{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:10px}
.fg-item{display:grid;grid-template-columns:20px minmax(0,1fr);grid-template-rows:1fr auto;align-items:start;gap:10px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-itemIcon{flex:none;display:inline-flex;width:20px;height:20px}
.fg-itemBody{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:1px}
.fg-itemName{display:flex;align-items:baseline;gap:6px;font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600}
.fg-itemOwn{font-size:calc(var(--fg-font-size,15px) * 0.7692);font-weight:500;color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-itemNote{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-itemActions{grid-column:2;display:flex;align-items:center;flex-wrap:wrap;gap:6px}
.fg-itemName{flex-wrap:wrap;row-gap:2px}
.fg-order > .fg-btn{margin-top:auto}
.fg-itemMax{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary)}
.fg-empty{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);color:var(--dsw-alias-label-secondary)}
.fg-orders{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,240px),1fr));gap:10px}
.fg-order{display:flex;flex-direction:column;gap:8px;padding:10px 12px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1)}
.fg-order[data-ready="true"]{border-color:var(--dsw-alias-state-success-primary)}
.fg-orderHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;flex-wrap:wrap}
.fg-orderId{font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600}
.fg-orderReward{font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-orderItems{display:flex;flex-direction:column;gap:3px}
.fg-orderItem{display:flex;align-items:center;gap:6px;font-size:calc(var(--fg-font-size,15px) * 0.9231);color:var(--dsw-alias-label-secondary)}
.fg-orderItem[data-have="true"]{color:var(--dsw-alias-label-primary)}
.fg-orderHave{margin-left:auto;font-size:calc(var(--fg-font-size,15px) * 0.8462);font-variant-numeric:tabular-nums}
.fg-orderNote{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-state-warn-primary)}
.fg-dot{flex:none;display:inline-block;width:11px;height:11px;border-radius:50%;border:1px solid transparent;box-sizing:border-box}
.fg-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(min(100%,186px),1fr));gap:12px}
.fg-plot{box-sizing:border-box;display:flex;flex-direction:column;gap:8px;min-height:198px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1)}
.fg-plot[data-state="bloom"]{border-color:var(--dsw-alias-state-success-primary)}
.fg-plot[data-state="locked"]{background:transparent;border-style:dashed}
.fg-plot[data-paused="true"] .fg-meter:not(.fg-meterWet) .fg-meterFill{background:var(--dsw-alias-state-idle-primary)}
.fg-plot:focus{outline:none}
.fg-plot:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-art{position:relative;display:flex;align-items:flex-end;justify-content:center;height:116px}
.fg-art svg{display:block;width:116px;height:116px;overflow:visible}
.fg-visitor{appearance:none;position:absolute;top:0;right:4px;box-sizing:border-box;width:38px;height:38px;padding:4px;border:1px solid var(--dsw-alias-state-success-primary);border-radius:50%;background:var(--dsw-alias-bg-layer-1);cursor:pointer;animation:fg-bob 1.7s ease-in-out infinite alternate}
.fg-visitor:hover{background:var(--dsw-alias-bg-layer-2)}
.fg-visitor:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-art .fg-visitor svg{width:100%;height:100%}
.fg-glow{transform-box:fill-box;transform-origin:center;animation:fg-twinkle 2.2s ease-in-out infinite}
@keyframes fg-bob{from{transform:translateY(-2px)}to{transform:translateY(3px)}}
.fg-plant{transform-box:view-box;transform-origin:50px 90px;animation:fg-sway 5.5s ease-in-out infinite alternate}
.fg-sparkle{transform-box:view-box;transform-origin:center;animation:fg-twinkle 2.9s ease-in-out infinite}
.fg-mote{transform-box:view-box;animation:fg-drift 4.8s ease-in-out infinite}
.fg-haloRing{transform-box:view-box;animation:fg-turn 26s linear infinite}
@keyframes fg-twinkle{0%,100%{opacity:.3;transform:scale(.75)}50%{opacity:1;transform:scale(1.2)}}
@keyframes fg-drift{0%{opacity:0;transform:translateY(3px)}28%{opacity:.9}100%{opacity:0;transform:translateY(-11px)}}
@keyframes fg-turn{to{transform:rotate(360deg)}}
@keyframes fg-sway{from{transform:rotate(-1.6deg)}to{transform:rotate(1.6deg)}}
.fg-plotHead{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.fg-species{min-width:0;font-size:calc(var(--fg-font-size,15px) * 1.0);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-stage{flex:none;font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary)}
.fg-meter{position:relative;height:4px;border-radius:999px;background:var(--dsw-alias-bg-layer-2);overflow:hidden}
.fg-meterFill{display:block;height:100%;border-radius:999px;background:var(--dsw-alias-state-success-primary);transition:width .4s linear}
.fg-meterWet .fg-meterFill{background:var(--dsw-alias-label-secondary);opacity:.55}
.fg-meterWet[data-low="true"] .fg-meterFill{background:var(--dsw-alias-state-error-primary);opacity:1}
.fg-row{display:flex;align-items:baseline;justify-content:space-between;gap:8px;min-width:0}
.fg-note{min-width:0;font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-noteWarn{color:var(--dsw-alias-state-warn-primary)}
.fg-noteWet{flex:none;font-variant-numeric:tabular-nums}
.fg-actions{margin-top:auto;display:flex;gap:8px}
.fg-btn{appearance:none;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;gap:6px;height:28px;padding:0 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:8px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:500;line-height:1;cursor:pointer;transition:background .15s ease,border-color .15s ease}
.fg-btn:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.fg-btn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-btn:disabled{opacity:.45;cursor:not-allowed}
.fg-btnBlock{width:100%}
.fg-btnGrow{flex:1 1 0;min-width:0;padding:0 8px}
.fg-btnSmall{height:24px;padding:0 10px;font-size:calc(var(--fg-font-size,15px) * 0.8462)}
.fg-btnPrimary{border-color:var(--dsw-alias-state-success-primary);color:var(--dsw-alias-state-success-primary)}
.fg-btnPrimary:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2)}
.fg-btnGhost{border-color:transparent;background:transparent;color:var(--dsw-alias-label-secondary)}
.fg-btnGhost:hover:not(:disabled){background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.fg-btnDanger{border-color:var(--dsw-alias-state-error-primary);color:var(--dsw-alias-state-error-primary);background:transparent}
.fg-seeds{display:flex;flex-direction:column;gap:6px}
.fg-seedsHead{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary)}
.fg-seedHint{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-state-warn-primary)}
.fg-seedGrid{display:flex;flex-direction:column;gap:4px;max-height:150px;overflow:auto;padding-right:2px}
.fg-seed{display:flex;align-items:center;gap:5px;height:28px;padding:0 8px;border:1px solid var(--dsw-alias-border-l1);border-radius:8px;background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:calc(var(--fg-font-size,15px) * 0.8462);cursor:pointer;text-align:left;min-width:0}
.fg-seed:hover:not(:disabled){border-color:var(--dsw-alias-border-l2)}
.fg-seed:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-seed:disabled{opacity:.45;cursor:not-allowed}
.fg-seedName{min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-seedMeta{margin-left:auto;flex:none;font-size:calc(var(--fg-font-size,15px) * 0.7692);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-seedCancel{align-self:flex-start;margin-top:2px}
.fg-basket{display:flex;flex-wrap:wrap;gap:6px}
.fg-bloom{display:inline-flex;align-items:center;gap:5px;height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;background:var(--dsw-alias-bg-layer-1);color:var(--dsw-alias-label-primary);font-family:inherit;font-size:calc(var(--fg-font-size,15px) * 0.8462);cursor:pointer}
.fg-bloom:hover{border-color:var(--dsw-alias-state-success-primary);background:var(--dsw-alias-bg-layer-2)}
.fg-bloom:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-bloom[data-variant="hidden"]{border-color:#c99a1f;background:rgba(242,201,76,0.16)}
.fg-bloomArmed{border-color:var(--dsw-alias-state-error-primary);background:var(--dsw-alias-bg-layer-2)}
.fg-bloomOpen{border-color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2)}
.fg-preview{display:flex;align-items:flex-start;gap:14px;padding:12px;border:1px solid var(--dsw-alias-border-l1);border-radius:14px;background:var(--dsw-alias-bg-layer-1);flex-wrap:wrap}
.fg-preview:focus{outline:none}
.fg-preview:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-previewArt{flex:none;width:168px;height:168px;display:flex;align-items:center;justify-content:center}
.fg-previewArt svg{width:168px;height:168px;overflow:visible}
.fg-previewBody{flex:1 1 200px;min-width:0;display:flex;flex-direction:column;gap:3px}
.fg-previewHead{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap}
.fg-previewName{font-size:calc(var(--fg-font-size,15px) * 1.0769);font-weight:600}
.fg-previewVariant{align-self:center;padding:0 6px;border-radius:999px;border:1px solid var(--dsw-alias-border-l2);font-size:calc(var(--fg-font-size,15px) * 0.7692);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary)}
.fg-previewVariant[data-variant="hidden"]{border-color:#c99a1f;color:var(--dsw-alias-state-warn-primary)}
.fg-previewLatin{font-size:calc(var(--fg-font-size,15px) * 0.8462);font-style:italic;color:var(--dsw-alias-label-secondary)}
.fg-previewMeaning{font-size:calc(var(--fg-font-size,15px) * 0.9231);line-height:calc(var(--fg-font-size,15px) * 1.3846);color:var(--dsw-alias-label-primary)}
.fg-previewStats{display:flex;gap:12px;flex-wrap:wrap;font-size:calc(var(--fg-font-size,15px) * 0.8462);color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-previewActions{flex:none;display:flex;flex-direction:column;gap:6px;margin-left:auto}
.fg-bloomArmed .fg-bloomPrice{color:var(--dsw-alias-state-error-primary)}
.fg-bloomArt{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;flex:none}
.fg-bloomArt svg{width:22px;height:22px;overflow:visible}
.fg-bloomCount{color:var(--dsw-alias-label-secondary);font-variant-numeric:tabular-nums}
.fg-bloomPrice{color:var(--dsw-alias-state-success-primary);font-variant-numeric:tabular-nums}
.fg-codexToggle{appearance:none;display:flex;align-items:center;gap:10px;width:100%;padding:0;border:0;background:transparent;color:var(--dsw-alias-label-primary);font-family:inherit;cursor:pointer;text-align:left}
.fg-codexToggle:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:4px;border-radius:6px}
.fg-caret{font-size:calc(var(--fg-font-size,15px) * 0.7692);color:var(--dsw-alias-label-secondary);transition:transform .15s ease}
.fg-caret[data-open="true"]{transform:rotate(180deg)}
.fg-codexNotes{grid-column:1/-1;display:flex;flex-direction:column;gap:2px;margin-bottom:2px}
.fg-codexHint{margin:0;font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary)}
.fg-codexTeaser{font-size:calc(var(--fg-font-size,15px) * 0.7692);color:var(--dsw-alias-state-warn-primary)}
.fg-goldTag{display:inline-block;padding:0 4px;border-radius:4px;background:rgba(242,201,76,0.35);color:var(--dsw-alias-label-primary);font-size:calc(var(--fg-font-size,15px) * 0.6923);line-height:calc(var(--fg-font-size,15px) * 1.0)}
.fg-badge{display:inline-block;width:fit-content;padding:0 6px;border-radius:999px;border:1px solid currentColor;font-size:calc(var(--fg-font-size,15px) * 0.7692);line-height:calc(var(--fg-font-size,15px) * 1.0769)}
.fg-codex{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.fg-codexCard{display:flex;align-items:flex-start;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-codexCard[data-seen="false"]{background:transparent;border-style:dashed}
.fg-codexCard[data-spirit="true"]{border-color:var(--dsw-alias-state-warn-primary)}
.fg-codexArt{flex:none;width:60px;height:60px;display:flex;align-items:center;justify-content:center}
.fg-codexArtBtn{appearance:none;padding:0;border:0;background:transparent;cursor:pointer;border-radius:10px}
.fg-codexArtBtn:hover{background:var(--dsw-alias-bg-layer-2)}
.fg-codexArtBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-variantBtn{appearance:none;background:transparent;font-family:inherit;cursor:pointer}
.fg-variantBtn:hover{background:var(--dsw-alias-bg-layer-2);color:var(--dsw-alias-label-primary)}
.fg-variantBtn:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px}
.fg-codexArt svg{width:60px;height:60px;overflow:visible}
.fg-codexBody{min-width:0;display:flex;flex-direction:column;gap:2px}
.fg-codexName{font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-codexLatin{font-size:calc(var(--fg-font-size,15px) * 0.7692);font-style:italic;color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-codexMeaning{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-primary)}
.fg-codexVariants{display:flex;flex-wrap:wrap;gap:4px;margin-top:2px}
.fg-variant{display:inline-flex;align-items:center;gap:4px;height:18px;padding:0 6px;border:1px solid var(--dsw-alias-border-l1);border-radius:999px;font-size:calc(var(--fg-font-size,15px) * 0.7692);color:var(--dsw-alias-label-secondary)}
.fg-variant[data-found="true"]{color:var(--dsw-alias-label-primary)}
.fg-variant[data-variant="hidden"][data-found="true"]{border-color:#c99a1f;color:var(--dsw-alias-state-warn-primary)}
.fg-variantCount{font-variant-numeric:tabular-nums}
.fg-variantArt{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;flex:none}
.fg-variantArt svg{width:16px;height:16px;overflow:visible}
.fg-chipMarket{border-color:#c99a1f}
.fg-marketTag{display:inline-block;padding:0 4px;border-radius:4px;border:1px solid #c99a1f;color:var(--dsw-alias-state-warn-primary);font-size:calc(var(--fg-font-size,15px) * 0.6923);line-height:calc(var(--fg-font-size,15px) * 1.0)}
.fg-headAction{margin-left:auto}
.fg-badgeOk{color:var(--dsw-alias-state-success-primary)}
.fg-badgeWarn{color:var(--dsw-alias-state-warn-primary)}
.fg-guests{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px}
.fg-guest{display:flex;align-items:center;gap:10px;padding:6px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-guest[data-met="false"]{background:transparent;border-style:dashed}
.fg-guest[data-met="false"] .fg-guestArt{filter:grayscale(1) brightness(.75);opacity:.35}
.fg-guestArt{flex:none;display:inline-flex;width:32px;height:32px}
.fg-guestArt svg{width:32px;height:32px}
.fg-guestBody{min-width:0;display:flex;flex-direction:column;gap:1px}
.fg-guestName{display:flex;align-items:baseline;gap:6px;font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600}
.fg-guestWhere{font-size:calc(var(--fg-font-size,15px) * 0.7692);line-height:calc(var(--fg-font-size,15px) * 1.1538);color:var(--dsw-alias-label-secondary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fg-achs{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px}
.fg-ach{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--dsw-alias-border-l1);border-radius:12px;background:var(--dsw-alias-bg-layer-1);min-width:0}
.fg-ach[data-state="ready"]{border-color:var(--dsw-alias-state-success-primary)}
.fg-ach[data-state="claimed"]{opacity:.6}
.fg-achBody{flex:1 1 auto;min-width:0;display:flex;flex-direction:column;gap:2px}
.fg-achName{font-size:calc(var(--fg-font-size,15px) * 0.9231);font-weight:600}
.fg-achDesc{font-size:calc(var(--fg-font-size,15px) * 0.8462);line-height:calc(var(--fg-font-size,15px) * 1.2308);color:var(--dsw-alias-label-secondary)}
.fg-achMeter{flex:1 1 auto}
.fg-footer{display:flex;align-items:flex-start;justify-content:flex-end;gap:16px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--dsw-alias-border-l1)}
.fg-footer .fg-save{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-right:auto}
.fg-fileInput{display:none}
.fg-savePending{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 12px;border:1px solid var(--dsw-alias-border-l2);border-radius:10px;background:var(--dsw-alias-bg-layer-1)}
.fg-saveAsking{font-size:calc(var(--fg-font-size,15px) * 0.9231);color:var(--dsw-alias-label-secondary)}
@media (prefers-reduced-motion:reduce){.fg-plant,.fg-sparkle,.fg-mote,.fg-haloRing,.fg-visitor,.fg-miniVisitor,.fg-glow{animation:none}.fg-sparkle{opacity:.85}.fg-meterFill{transition:none}.fg-caret{transition:none}}
`

