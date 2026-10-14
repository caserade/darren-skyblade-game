/* WEIGHT STAGES: shared by every creature that can gain weight (Dumpling and the two Stormbelly dragons).
   A creature carries weight points from 0 to 1 (never more) and has 7 fixed stages in its data:
     stages: [{ name, at, size, lbs }, ...]   at   = weight points needed for that stage
                                              size = how big the body is drawn at that stage (0..1)
                                              lbs  = the weight shown in the Hangar
   The body only ever shows its stage's size (it eases between stages), so it cannot keep swelling:
   the last stage is the limit. */
const WEIGHT_STAGES = 7;
function stageIndex(stages, w) {
  let k = 0;
  for (let i = 0; i < stages.length; i++) if (w >= stages[i].at - 1e-6) k = i;
  return k;
}
function stageInfo(stages, w) {
  const k = stageIndex(stages, w),
    S = stages[k],
    N = stages[k + 1];
  return {
    k,
    name: S.name,
    size: S.size,
    lbs: S.lbs,
    max: k === stages.length - 1,
    // 0..1 progress towards the next stage (1 at the last stage)
    next: N ? clamp((w - S.at) / (N.at - S.at), 0, 1) : 1,
  };
}
