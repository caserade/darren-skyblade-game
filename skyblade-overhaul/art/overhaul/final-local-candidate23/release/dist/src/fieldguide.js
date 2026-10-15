/* Player-facing atlas. Entries describe implemented behavior. */
function fillFieldGuide(box) {
  const intro=section(box,'Stormglass Reach','Chapter 3 · Restore the beacons above Cloudroost. Select Chapter 3 on the title screen to begin.');
  const img=el('img','concept-sheet');img.src='assets/stormglass-concept.webp';img.alt='Concept sheet: floating observatory islands, Stormling, Wardling, Tempest Warden, beacon and updraft ring.';intro.appendChild(img);
  intro.appendChild(el('p','hint','Visual development concept. The playable models use simplified procedural geometry.'));
  const entries=[
    ['Updraft rings','Travel','Enter a cyan ring column to rise and refill flight energy. V toggles flight; hold Space to climb. Rings do not bypass locked story bridges.'],
    ['Stormling','Flying attacker · 100 base HP','Flashes for 0.8 seconds, then fires a fan of three crystal shards. Sidestep the fan and close the distance during its recovery.'],
    ['Wardling','Guarded charger · 240 base HP','Its front blocks most damage. Circle behind it, use a breath attack, or punish the long recovery after its charge. Its guard breaks below half health.'],
    ['Stormbelly','Heavy dragon � 360 base HP','In Gale Gardens, its amber circle warns for 1.1 seconds before a stomp. Jump over the impact or leave the circle, then attack during its long recovery.'],
    ['Chomp Rex','Charging dinosaur � 260 base HP','In the Observatory, its amber arrow warns for 0.8 seconds before a short charge and bite. Dodge sideways after it commits, then attack while it catches its breath.'],
    ['Sky Drake','Gale Spires - Adventure - 2,400 base HP','The tall indigo dragon circles overhead before a swoop. Leave its amber landing circle during the 0.9-second warning. On the ground, its wider ring warns of a tail sweep for 0.7 seconds; jump or step outside it. Attack during its landing and recovery.'],
    ['Tempest Warden','Three-phase boss · 3,600 base HP','Break the two arm crystals to bring it down, then reach the back core. Below 60% health, violet circles warn of lightning 1.3 seconds before impact. The lightning column reaches airborne players too. Below 25%, the back core opens and the Warden can summon Stormlings.'],
    ['Stormsaber','Skyforge recipe','Collect 12 Stormglass and 1 Tempest Core, then craft the saber in Forge and equip it in Loadout. It trades raw power for fast swings and wider reach.'],
    ['Sky beacons','Chapter progress','Clear Gale Gardens and the Observatory to light their beacons and unlock each bridge. Defeat the Warden to restore the last beacon. Chapter checkpoints and crafted equipment save in this browser.']
  ];
  const grid=el('div','guide-grid');
  for(const [name,tag,note] of entries){const card=el('article','guide-card');card.appendChild(el('small','',tag));card.appendChild(el('h5','',name));card.appendChild(el('p','',note));grid.appendChild(card);}box.appendChild(grid);
  const link=el('a','guide-link','Open the full concept sheet');link.href='assets/stormglass-concept.webp';link.target='_blank';link.rel='noopener';box.appendChild(link);
}
const guideButton=el('button','go opt','Field guide · Stormglass concept art');guideButton.type='button';guideButton.addEventListener('click',()=>openPanel('guide'));$('optBtn').parentElement.appendChild(guideButton);
