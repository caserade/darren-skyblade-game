/* Player-facing atlas. Entries describe implemented behavior. */
function fillFieldGuide(box) {
  const intro=section(box,'Stormglass Reach','Chapter 3 · Restore the beacons above Cloudroost. Select Chapter 3 on the title screen to begin.');
  const img=el('img','concept-sheet');img.src='assets/stormglass-concept.webp';img.alt='Concept sheet: floating observatory islands, Stormling, Wardling, Tempest Warden, beacon and updraft ring.';intro.appendChild(img);
  intro.appendChild(el('p','hint','Visual development concept. Stormlings, Wardlings and the Warden are built from simpler shapes in the game; the young Stormbelly and Chomp Rex use the sculpted Cloud Utopia models.'));
  const entries=[
    ['Updraft rings','Travel','Enter a cyan ring column to rise and refill flight energy. V toggles flight; hold Space to climb. Rings do not bypass locked story bridges.'],
    ['Stormling','Flying attacker · 100 base HP','Flashes for 0.8 seconds, then fires a fan of three crystal shards. Sidestep the fan and close the distance during its recovery.'],
    ['Wardling','Guarded charger · 240 base HP','Its front blocks most damage. Circle behind it, use a breath attack, or punish the long recovery after its charge. Its guard breaks below half health.'],
    ['Young Stormbelly','Heavy dragon · 360 base HP','In Gale Gardens, its amber circle warns for 1.1 seconds before a stomp. Jump over the impact or leave the circle, then attack during its long recovery.'],
    ['Young Chomp Rex','Charging dinosaur · 260 base HP','In the Observatory, its amber arrow warns for 0.8 seconds before a short charge and bite. Dodge sideways after it commits, then attack while it catches its breath.'],
    ['Sky Drake','Stormbelly · Gale Spires · Adventure','A sculpted, rigged roaming dragon that takes off, swoops and whips its tail. The two adult Stormbellies eat snack bushes and grow through seven weight stages (stage 7 is the limit); shake bushes first to keep them smaller.'],
    ['Tempest Warden','Three-phase boss · 3,600 base HP','Break the two arm crystals to bring it down, then reach the back core. Below 60% health, violet circles warn of lightning 1.3 seconds before impact. The lightning column reaches airborne players too. Below 25%, the back core opens and the Warden can summon Stormlings.'],
    ['Stormsaber','Skyforge recipe','Collect 12 Stormglass and 1 Tempest Core, then craft the saber in Forge and equip it in Loadout. It trades raw power for fast swings and wider reach.'],
    ['Sky beacons','Chapter progress','Clear Gale Gardens and the Observatory to light their beacons and unlock each bridge. Defeat the Warden to restore the last beacon. Chapter checkpoints and crafted equipment save in this browser.']
  ];
  entries.push(['Dumpling','Cloud Utopia companion','Meet the cloud drake by the bakery, gather snacks, bake treats and feed him from the Dumpling tab. His seven weight stages change his movement and bounce abilities.'],['Heavyweight & Chomp Rex','Cloud Utopia roaming monsters','Find Heavyweight on Sparkstone Mesa and the larger Chomp Rex in Thorn Wastes. Jump over the stomp shockwave and sidestep the Rex charge. Their contracts unlock new forge materials.']);
  const grid=el('div','guide-grid');
  for(const [name,tag,note] of entries){const card=el('article','guide-card');card.appendChild(el('small','',tag));card.appendChild(el('h5','',name));card.appendChild(el('p','',note));grid.appendChild(card);}box.appendChild(grid);
  // single-file builds carry the sheet as a data URI, which browsers will not open in a new tab: show the link only for the folder version
  if(!img.src.startsWith('data:')){const link=el('a','guide-link','Open the full concept sheet');link.href='assets/stormglass-concept.webp';link.target='_blank';link.rel='noopener';box.appendChild(link);}
}
const guideButton=el('button','go opt','Field guide · Stormglass concept art');guideButton.type='button';guideButton.addEventListener('click',()=>openPanel('guide'));$('optBtn').parentElement.appendChild(guideButton);
