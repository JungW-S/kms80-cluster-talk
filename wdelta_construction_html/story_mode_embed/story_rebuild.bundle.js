// Generated bundle for file:// presentation embedding. Source modules live in src/*.mjs.
(() => {

const __dynkin = (() => {

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function normalizeDynkinFamily(value = "A") {
  const family = String(value ?? "A").trim().toUpperCase();
  if (!["A", "D", "E"].includes(family)) {
    throw new Error(`Dynkin type must be A, D, or E.`);
  }
  return family;
}

function dynkinEdges(family, rank) {
  if (family === "A") {
    return Array.from({ length: Math.max(rank - 1, 0) }, (_, idx) => [idx + 1, idx + 2]);
  }
  if (family === "D") {
    if (rank < 4) throw new Error("Type D_n requires n >= 4.");
    const edges = [];
    for (let i = 1; i <= rank - 3; i += 1) edges.push([i, i + 1]);
    edges.push([rank - 2, rank - 1], [rank - 2, rank]);
    return edges;
  }
  if (rank < 6 || rank > 8) throw new Error("Type E_n requires n = 6, 7, or 8.");
  const edges = [[1, 3], [3, 4], [2, 4]];
  for (let i = 4; i < rank; i += 1) edges.push([i, i + 1]);
  return edges;
}

function cartanMatrix(rank, edges) {
  const cartan = Array.from({ length: rank }, (_, row) => (
    Array.from({ length: rank }, (_, col) => (row === col ? 2 : 0))
  ));
  edges.forEach(([a, b]) => {
    cartan[a - 1][b - 1] = -1;
    cartan[b - 1][a - 1] = -1;
  });
  return cartan;
}

function basisVector(rank, index) {
  const out = Array(rank).fill(0);
  out[index - 1] = 1;
  return out;
}

function vectorKey(vector) {
  return vector.join(",");
}

function reflectVector(vector, generator, cartan) {
  const out = vector.slice();
  const idx = generator - 1;
  let pairing = 0;
  for (let col = 0; col < vector.length; col += 1) {
    pairing += cartan[idx][col] * vector[col];
  }
  out[idx] -= pairing;
  return out;
}

function isPositiveRoot(vector) {
  return vector.some((entry) => entry > 0) && vector.every((entry) => entry >= 0);
}

function isNegativeRoot(vector) {
  return vector.some((entry) => entry < 0) && vector.every((entry) => entry <= 0);
}

function enumeratePositiveRoots(rank, cartan) {
  const queue = Array.from({ length: rank }, (_, idx) => basisVector(rank, idx + 1));
  const seen = new Map(queue.map((root) => [vectorKey(root), root]));
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const root = queue[cursor];
    for (let generator = 1; generator <= rank; generator += 1) {
      const reflected = reflectVector(root, generator, cartan);
      const key = vectorKey(reflected);
      if (seen.has(key)) continue;
      seen.set(key, reflected);
      queue.push(reflected);
    }
  }
  return [...seen.values()].filter(isPositiveRoot);
}

function identityCoxeterElement(datum) {
  return Array.from({ length: datum.rank }, (_, idx) => basisVector(datum.rank, idx + 1));
}

function applyElementToVector(element, vector) {
  const out = Array(vector.length).fill(0);
  vector.forEach((coefficient, idx) => {
    if (coefficient === 0) return;
    element[idx].forEach((entry, row) => {
      out[row] += coefficient * entry;
    });
  });
  return out;
}

function rightMultiplySimpleReflection(element, generator, datum) {
  const idx = generator - 1;
  const image = element[idx];
  return element.map((column, colIdx) => {
    const coefficient = datum.cartan[idx][colIdx];
    if (coefficient === 0) return column.slice();
    return column.map((entry, row) => entry - coefficient * image[row]);
  });
}

function leftMultiplySimpleReflection(element, generator, datum) {
  return element.map((column) => reflectVector(column, generator, datum.cartan));
}

function coxeterLength(element, datum) {
  return datum.positiveRoots.filter((root) => isNegativeRoot(applyElementToVector(element, root))).length;
}

function elementKey(element) {
  return element.map(vectorKey).join("|");
}

function computeW0Word(datum, chooseIndex = 0) {
  let element = identityCoxeterElement(datum);
  const word = [];
  const targetLength = datum.positiveRoots.length;
  while (word.length < targetLength) {
    const candidates = [];
    for (let generator = 1; generator <= datum.rank; generator += 1) {
      if (isPositiveRoot(element[generator - 1])) candidates.push(generator);
    }
    if (candidates.length === 0) throw new Error(`Could not construct a reduced word for w_0 in type ${datum.label}.`);
    const generator = candidates[Math.min(chooseIndex, candidates.length - 1)];
    word.push(generator);
    element = rightMultiplySimpleReflection(element, generator, datum);
  }
  return { word, element };
}

function computeStarMap(datum, w0Element) {
  const star = new Map();
  for (let i = 1; i <= datum.rank; i += 1) {
    const image = w0Element[i - 1];
    const target = image.findIndex((entry, idx) => entry === -1 && image.every((value, j) => j === idx || value === 0));
    if (target < 0) throw new Error(`Could not compute i* for type ${datum.label}.`);
    star.set(i, target + 1);
  }
  return star;
}

function createDynkinDatum({ family = "A", rank }) {
  const normalizedFamily = normalizeDynkinFamily(family);
  assertPositiveInteger(rank, "rank");
  const edges = dynkinEdges(normalizedFamily, rank);
  const cartan = cartanMatrix(rank, edges);
  const adjacency = new Map(Array.from({ length: rank }, (_, idx) => [idx + 1, []]));
  edges.forEach(([a, b]) => {
    adjacency.get(a).push(b);
    adjacency.get(b).push(a);
  });
  adjacency.forEach((neighbors) => neighbors.sort((a, b) => a - b));
  const datum = {
    family: normalizedFamily,
    rank,
    label: `${normalizedFamily}_${rank}`,
    edges,
    cartan,
    adjacency,
    positiveRoots: enumeratePositiveRoots(rank, cartan),
  };
  const { word, element } = computeW0Word(datum, 0);
  datum.standardHalfTwistWord = word;
  datum.star = computeStarMap(datum, element);
  return datum;
}

function randomHalfTwistWordForDatum(datum) {
  let element = identityCoxeterElement(datum);
  const word = [];
  const targetLength = datum.positiveRoots.length;
  while (word.length < targetLength) {
    const candidates = [];
    for (let generator = 1; generator <= datum.rank; generator += 1) {
      if (isPositiveRoot(element[generator - 1])) candidates.push(generator);
    }
    if (candidates.length === 0) throw new Error(`Could not construct a random reduced word for w_0 in type ${datum.label}.`);
    const generator = candidates[Math.floor(Math.random() * candidates.length)];
    word.push(generator);
    element = rightMultiplySimpleReflection(element, generator, datum);
  }
  return word;
}

function reducedWordFromCoxeterElement(element, datum) {
  let current = element.map((column) => column.slice());
  const word = [];
  while (coxeterLength(current, datum) > 0) {
    let found = false;
    for (let generator = 1; generator <= datum.rank; generator += 1) {
      if (!isNegativeRoot(current[generator - 1])) continue;
      current = rightMultiplySimpleReflection(current, generator, datum);
      word.push(generator);
      found = true;
      break;
    }
    if (!found) throw new Error(`Could not reduce a Coxeter element in type ${datum.label}.`);
  }
  return word.reverse();
}

function validateSequenceInDynkin(sequence, datum, name) {
  sequence.forEach((entry) => {
    if (!Number.isInteger(entry) || entry < 1 || entry > datum.rank) {
      throw new Error(`${name} contains ${entry}, which is outside type ${datum.label}.`);
    }
  });
}

function areAdjacent(datum, left, right) {
  return datum.adjacency.get(left)?.includes(right) ?? false;
}

return { normalizeDynkinFamily, identityCoxeterElement, rightMultiplySimpleReflection, leftMultiplySimpleReflection, coxeterLength, createDynkinDatum, randomHalfTwistWordForDatum, reducedWordFromCoxeterElement, validateSequenceInDynkin, areAdjacent };
})();

const __weave = (() => {
const { areAdjacent, coxeterLength, createDynkinDatum, identityCoxeterElement, leftMultiplySimpleReflection, reducedWordFromCoxeterElement, rightMultiplySimpleReflection } = __dynkin;

function key(word) {
  return word.join(",");
}

function identityPermutationA(rank) {
  return Array.from({ length: rank + 1 }, (_, idx) => idx + 1);
}

function lengthPermutationA(permutation) {
  let out = 0;
  for (let i = 0; i < permutation.length; i += 1) {
    for (let j = i + 1; j < permutation.length; j += 1) {
      if (permutation[i] > permutation[j]) out += 1;
    }
  }
  return out;
}

function rightMultiplySimpleReflectionA(permutation, generator) {
  const out = permutation.slice();
  const idx = generator - 1;
  [out[idx], out[idx + 1]] = [out[idx + 1], out[idx]];
  return out;
}

function leftMultiplySimpleReflectionA(permutation, generator) {
  const out = permutation.slice();
  const posA = out.indexOf(generator);
  const posB = out.indexOf(generator + 1);
  [out[posA], out[posB]] = [out[posB], out[posA]];
  return out;
}

function reducedWordFromPermutationA(permutation) {
  const arr = permutation.slice();
  const rank = arr.length - 1;
  const word = [];
  while (true) {
    let changed = false;
    for (let idx = 0; idx < rank; idx += 1) {
      if (arr[idx] > arr[idx + 1]) {
        [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
        word.push(idx + 1);
        changed = true;
      }
    }
    if (!changed) break;
  }
  return word.reverse();
}

function reducedWordNeighbors(word, datum = null) {
  const out = [];
  for (let pos = 0; pos < word.length - 1; pos += 1) {
    const a = word[pos];
    const b = word[pos + 1];
    const adjacent = datum ? areAdjacent(datum, a, b) : Math.abs(a - b) === 1;
    if (a !== b && !adjacent) {
      out.push({
        word: [...word.slice(0, pos), b, a, ...word.slice(pos + 2)],
        move: { type: "tetra", pos },
      });
    }
  }
  for (let pos = 0; pos < word.length - 2; pos += 1) {
    const a = word[pos];
    const b = word[pos + 1];
    const c = word[pos + 2];
    const adjacent = datum ? areAdjacent(datum, a, b) : Math.abs(a - b) === 1;
    if (a === c && adjacent) {
      out.push({
        word: [...word.slice(0, pos), b, a, b, ...word.slice(pos + 3)],
        move: { type: "hexa", pos },
      });
    }
  }
  return out;
}

function braidPathBetweenWords(startWord, targetWord, datum = null) {
  const startKey = key(startWord);
  const targetKey = key(targetWord);
  if (startKey === targetKey) return { words: [startWord.slice()], moves: [] };

  const queue = [startWord.slice()];
  const previous = new Map([[startKey, { parent: null, move: null, word: startWord.slice() }]]);

  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const current = queue[cursor];
    for (const neighbor of reducedWordNeighbors(current, datum)) {
      const neighborKey = key(neighbor.word);
      if (previous.has(neighborKey)) continue;
      previous.set(neighborKey, {
        parent: key(current),
        move: neighbor.move,
        word: neighbor.word,
      });
      if (neighborKey === targetKey) {
        cursor = queue.length;
        break;
      }
      queue.push(neighbor.word);
    }
  }

  if (!previous.has(targetKey)) {
    throw new Error("No braid-only path was found for the double inductive weave.");
  }

  const words = [];
  const moves = [];
  let cursor = targetKey;
  while (cursor !== null) {
    const entry = previous.get(cursor);
    words.push(entry.word.slice());
    if (entry.move !== null) moves.push(entry.move);
    cursor = entry.parent;
  }
  words.reverse();
  moves.reverse();
  return { words, moves };
}

function commonPrefixLength(left, right) {
  let idx = 0;
  while (idx < left.length && idx < right.length && left[idx] === right[idx]) idx += 1;
  return idx;
}

function commonSuffixLength(left, right, prefixLength = 0) {
  let count = 0;
  while (
    count + prefixLength < left.length
    && count + prefixLength < right.length
    && left[left.length - 1 - count] === right[right.length - 1 - count]
  ) count += 1;
  return count;
}

function lcsLength(left, right) {
  const dp = Array(right.length + 1).fill(0);
  for (let i = 0; i < left.length; i += 1) {
    let prev = 0;
    for (let j = 0; j < right.length; j += 1) {
      const saved = dp[j + 1];
      dp[j + 1] = left[i] === right[j]
        ? prev + 1
        : Math.max(dp[j + 1], dp[j]);
      prev = saved;
    }
  }
  return dp[right.length];
}

function targetScore(word, targetWord, depth) {
  const prefix = commonPrefixLength(word, targetWord);
  const suffix = commonSuffixLength(word, targetWord, prefix);
  let hamming = 0;
  for (let idx = 0; idx < word.length; idx += 1) {
    if (word[idx] !== targetWord[idx]) hamming += 1;
  }
  return 160 * prefix + 24 * suffix + 7 * lcsLength(word, targetWord) - 2 * hamming - 0.35 * depth;
}

function reconstructBeamPath(targetKey, records) {
  const words = [];
  const moves = [];
  let cursor = targetKey;
  while (cursor !== null) {
    const record = records.get(cursor);
    words.push(record.word.slice());
    if (record.move !== null) moves.push(record.move);
    cursor = record.parent;
  }
  words.reverse();
  moves.reverse();
  return { words, moves };
}

function reconstructBidirectionalPath(meetKey, forwardRecords, backwardRecords) {
  const leftWords = [];
  const leftMoves = [];
  let cursor = meetKey;
  while (cursor !== null) {
    const record = forwardRecords.get(cursor);
    leftWords.push(record.word.slice());
    if (record.move !== null) leftMoves.push(record.move);
    cursor = record.parent;
  }
  leftWords.reverse();
  leftMoves.reverse();

  const rightWords = [];
  const rightMoves = [];
  cursor = meetKey;
  while (true) {
    const record = backwardRecords.get(cursor);
    if (!record || record.parent === null) break;
    rightMoves.push(record.move);
    cursor = record.parent;
    rightWords.push(backwardRecords.get(cursor).word.slice());
  }

  return {
    words: [...leftWords, ...rightWords],
    moves: [...leftMoves, ...rightMoves],
  };
}

function bidirectionalBraidPathBetweenWords(startWord, targetWord, datum) {
  const startKey = key(startWord);
  const targetKey = key(targetWord);
  if (startKey === targetKey) return { words: [startWord.slice()], moves: [] };

  const maxVisited = startWord.length <= 20 ? 90000 : 260000;
  const forwardRecords = new Map([[startKey, {
    parent: null,
    move: null,
    word: startWord.slice(),
  }]]);
  const backwardRecords = new Map([[targetKey, {
    parent: null,
    move: null,
    word: targetWord.slice(),
  }]]);
  let forwardFrontier = [startKey];
  let backwardFrontier = [targetKey];

  while (forwardFrontier.length > 0 && backwardFrontier.length > 0) {
    if (forwardRecords.size + backwardRecords.size > maxVisited) break;
    const expandForward = forwardFrontier.length <= backwardFrontier.length;
    const ownRecords = expandForward ? forwardRecords : backwardRecords;
    const otherRecords = expandForward ? backwardRecords : forwardRecords;
    const frontier = expandForward ? forwardFrontier : backwardFrontier;
    const nextFrontier = [];

    for (const currentKey of frontier) {
      const current = ownRecords.get(currentKey);
      for (const neighbor of reducedWordNeighbors(current.word, datum)) {
        const neighborKey = key(neighbor.word);
        if (ownRecords.has(neighborKey)) continue;
        ownRecords.set(neighborKey, {
          parent: currentKey,
          move: neighbor.move,
          word: neighbor.word,
        });
        if (otherRecords.has(neighborKey)) {
          return reconstructBidirectionalPath(neighborKey, forwardRecords, backwardRecords);
        }
        nextFrontier.push(neighborKey);
      }
    }

    if (expandForward) forwardFrontier = nextFrontier;
    else backwardFrontier = nextFrontier;
  }

  throw new Error(`No braid path was found within the bidirectional search limit for type ${datum.label}.`);
}

function beamBraidPathBetweenWords(startWord, targetWord, datum) {
  const startKey = key(startWord);
  const targetKey = key(targetWord);
  if (startKey === targetKey) return { words: [startWord.slice()], moves: [] };

  const maxDepth = Math.max(40, 8 * startWord.length);
  const beamWidth = startWord.length <= 20 ? 2500 : 6500;
  const records = new Map([[startKey, {
    parent: null,
    move: null,
    word: startWord.slice(),
    depth: 0,
  }]]);
  let frontier = [{
    key: startKey,
    word: startWord.slice(),
    score: targetScore(startWord, targetWord, 0),
  }];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const candidates = new Map();
    frontier.forEach((state) => {
      reducedWordNeighbors(state.word, datum).forEach((neighbor) => {
        const neighborKey = key(neighbor.word);
        if (records.has(neighborKey)) return;
        const score = targetScore(neighbor.word, targetWord, depth);
        const old = candidates.get(neighborKey);
        if (!old || score > old.score) {
          candidates.set(neighborKey, {
            key: neighborKey,
            word: neighbor.word,
            parent: state.key,
            move: neighbor.move,
            depth,
            score,
          });
        }
      });
    });
    const ranked = [...candidates.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, beamWidth);
    for (const entry of ranked) {
      records.set(entry.key, {
        parent: entry.parent,
        move: entry.move,
        word: entry.word,
        depth: entry.depth,
      });
      if (entry.key === targetKey) return reconstructBeamPath(targetKey, records);
    }
    if (ranked.length === 0) break;
    frontier = ranked;
  }

  throw new Error(`No braid path was found quickly for type ${datum.label}. Try a smaller example or type A.`);
}

function fastBraidPathBetweenWords(startWord, targetWord, datum = null) {
  if (!datum || datum.family === "A") return braidPathBetweenWords(startWord, targetWord, datum);
  try {
    return bidirectionalBraidPathBetweenWords(startWord, targetWord, datum);
  } catch {
    return beamBraidPathBetweenWords(startWord, targetWord, datum);
  }
}

function wordHasSideDescent(word, generator, side) {
  if (word.length === 0) return false;
  return side === "L" ? word[0] === generator : word[word.length - 1] === generator;
}

function coxeterElementFromWord(word, datum) {
  let element = identityCoxeterElement(datum);
  word.forEach((generator) => {
    element = rightMultiplySimpleReflection(element, generator, datum);
  });
  return element;
}

function canonicalSideDescentWord(word, generator, side, datum) {
  const element = coxeterElementFromWord(word, datum);
  const shorter = side === "L"
    ? reducedWordFromCoxeterElement(leftMultiplySimpleReflection(element, generator, datum), datum)
    : reducedWordFromCoxeterElement(rightMultiplySimpleReflection(element, generator, datum), datum);
  return side === "L" ? [generator, ...shorter] : [...shorter, generator];
}

function sideDescentScore(word, generator, side, depth) {
  const positions = [];
  word.forEach((entry, idx) => {
    if (entry === generator) positions.push(idx);
  });
  if (positions.length === 0) return -100000 - depth;
  const distance = side === "L"
    ? Math.min(...positions)
    : Math.min(...positions.map((idx) => word.length - 1 - idx));
  const edgeBonus = wordHasSideDescent(word, generator, side) ? 10000 : 0;
  const nearEdgeCount = positions.filter((idx) => (
    side === "L" ? idx <= 3 : word.length - 1 - idx <= 3
  )).length;
  return edgeBonus + 180 * (word.length - distance) + 18 * nearEdgeCount - depth;
}

function braidPathToSideDescent(startWord, generator, side, datum) {
  if (wordHasSideDescent(startWord, generator, side)) {
    return { words: [startWord.slice()], moves: [] };
  }

  if (startWord.length <= 45) {
    try {
      return fastBraidPathBetweenWords(
        startWord,
        canonicalSideDescentWord(startWord, generator, side, datum),
        datum,
      );
    } catch {
      // Fall through to the cheaper target-free search below.
    }
  }

  const startKey = key(startWord);
  const maxDepth = Math.max(40, 10 * startWord.length);
  const beamWidth = startWord.length <= 20 ? 3000 : 9000;
  const records = new Map([[startKey, {
    parent: null,
    move: null,
    word: startWord.slice(),
    depth: 0,
  }]]);
  let frontier = [{
    key: startKey,
    word: startWord.slice(),
    score: sideDescentScore(startWord, generator, side, 0),
  }];

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const candidates = new Map();
    frontier.forEach((state) => {
      reducedWordNeighbors(state.word, datum).forEach((neighbor) => {
        const neighborKey = key(neighbor.word);
        if (records.has(neighborKey)) return;
        const score = sideDescentScore(neighbor.word, generator, side, depth);
        const old = candidates.get(neighborKey);
        if (!old || score > old.score) {
          candidates.set(neighborKey, {
            key: neighborKey,
            word: neighbor.word,
            parent: state.key,
            move: neighbor.move,
            depth,
            score,
          });
        }
      });
    });
    const ranked = [...candidates.values()]
      .sort((a, b) => b.score - a.score)
      .slice(0, beamWidth);
    for (const entry of ranked) {
      records.set(entry.key, {
        parent: entry.parent,
        move: entry.move,
        word: entry.word,
        depth: entry.depth,
      });
      if (wordHasSideDescent(entry.word, generator, side)) {
        return reconstructBeamPath(entry.key, records);
      }
    }
    if (ranked.length === 0) break;
    frontier = ranked;
  }

  throw new Error(`No braid path to a ${side === "L" ? "left" : "right"} ${generator}-descent was found quickly for type ${datum.label}.`);
}

function entryLabel(entry) {
  return `${entry.h}${entry.side}${entry.plus ? "+" : ""}`;
}

function applyMoveToCycleWeights(weights, move) {
  const out = weights.slice();
  const p = move.pos;
  if (move.type === "tetra") {
    [out[p], out[p + 1]] = [out[p + 1], out[p]];
    return out;
  }
  if (move.type === "hexa") {
    const a1 = out[p];
    const a2 = out[p + 1];
    const a3 = out[p + 2];
    const min = Math.min(a1, a3);
    return [
      ...out.slice(0, p),
      a2 + a3 - min,
      min,
      a1 + a2 - min,
      ...out.slice(p + 3),
    ];
  }
  if (move.type === "tri") {
    const min = Math.min(out[p], out[p + 1]);
    return [
      ...out.slice(0, p),
      min,
      ...out.slice(p + 2),
    ];
  }
  throw new Error(`Unknown weave move type: ${move.type}`);
}

function computeLusztigCycleForTrivalentVertex(words, moves, triMoveIndex) {
  const rows = [];
  for (let idx = 0; idx <= triMoveIndex; idx += 1) {
    rows.push(Array(words[idx].length).fill(0));
  }
  const p = moves[triMoveIndex].pos;
  let weights = Array(words[triMoveIndex + 1].length).fill(0);
  weights[p] = 1;
  rows.push(weights.slice());
  for (let idx = triMoveIndex + 1; idx < moves.length; idx += 1) {
    weights = applyMoveToCycleWeights(weights, moves[idx]);
    rows.push(weights.slice());
  }
  return rows;
}

function computeAllLusztigCycles(words, moves, stepInfos) {
  return stepInfos
    .filter((info) => !info.plus)
    .map((info) => ({
      label: info.clusterVariable,
      step: info.step,
      triMoveIndex: info.triMoveIndex,
      cycleRows: computeLusztigCycleForTrivalentVertex(words, moves, info.triMoveIndex),
    }));
}

function formatUMonomial(cycles, rowIdx, edgeIdx) {
  const factors = cycles
    .map((cycle) => ({
      label: cycle.label,
      weight: cycle.cycleRows[rowIdx]?.[edgeIdx] ?? 0,
    }))
    .filter((item) => item.weight > 0)
    .map((item) => (item.weight === 1 ? item.label : `${item.label}^${item.weight}`));
  return factors.length === 0 ? "1" : factors.join("*");
}

function computeURows(words, cycles) {
  return words.map((word, rowIdx) => (
    word.map((_, edgeIdx) => formatUMonomial(cycles, rowIdx, edgeIdx))
  ));
}

function isAtomicExpression(expr) {
  return /^[A-Za-z0-9_]+(\^[0-9]+)?$/.test(expr);
}

function wrapExpression(expr) {
  return isAtomicExpression(expr) ? expr : `(${expr})`;
}

function multiplyExpressions(...factors) {
  const nontrivial = factors.filter((factor) => factor !== "1");
  if (nontrivial.includes("0")) return "0";
  if (nontrivial.length === 0) return "1";
  return nontrivial.map(wrapExpression).join("*");
}

function addExpressions(...terms) {
  const nonzero = terms.filter((term) => term !== "0");
  if (nonzero.length === 0) return "0";
  return nonzero.map(wrapExpression).join(" + ");
}

function negateExpression(expr) {
  if (expr === "0") return "0";
  if (expr === "1") return "-1";
  if (expr.startsWith("-") && isAtomicExpression(expr.slice(1))) return expr.slice(1);
  return `-${wrapExpression(expr)}`;
}

function divideExpressions(numerator, denominator) {
  if (numerator === "0") return "0";
  if (denominator === "1") return numerator;
  return `${wrapExpression(numerator)}/${wrapExpression(denominator)}`;
}

function powerExpression(expr, exponent) {
  if (exponent === 1) return expr;
  if (expr === "1") return "1";
  return `${wrapExpression(expr)}^${exponent}`;
}

function subtractExpressions(left, right) {
  if (right === "0") return left;
  if (left === "0") return negateExpression(right);
  return `${wrapExpression(left)} - ${wrapExpression(right)}`;
}

function zeroMatrix(size) {
  return Array.from({ length: size }, () => Array(size).fill("0"));
}

function identityMatrix(size) {
  const out = zeroMatrix(size);
  for (let idx = 0; idx < size; idx += 1) out[idx][idx] = "1";
  return out;
}

function clearSubmatrix(matrix, indices) {
  indices.forEach((row) => {
    indices.forEach((col) => {
      matrix[row][col] = "0";
    });
  });
}

function embeddedDualBlockMatrix(size, mainPair, dualPair, block) {
  const out = identityMatrix(size);
  const indices = [...mainPair, ...dualPair];
  clearSubmatrix(out, indices);
  const [[a, b], [c, d]] = block;
  out[mainPair[0]][mainPair[0]] = a;
  out[mainPair[0]][mainPair[1]] = b;
  out[mainPair[1]][mainPair[0]] = c;
  out[mainPair[1]][mainPair[1]] = d;

  out[dualPair[0]][dualPair[0]] = a;
  out[dualPair[0]][dualPair[1]] = negateExpression(b);
  out[dualPair[1]][dualPair[0]] = negateExpression(c);
  out[dualPair[1]][dualPair[1]] = d;
  return out;
}

function xiMatrixA(rank, generator, parameter) {
  const out = identityMatrix(rank + 1);
  out[generator - 1][generator] = parameter;
  return out;
}

function bChiMatrixA(rank, generator, zValue, uValue) {
  const out = identityMatrix(rank + 1);
  const i = generator - 1;
  out[i][i] = multiplyExpressions(zValue, uValue);
  out[i][i + 1] = negateExpression(divideExpressions("1", uValue));
  out[i + 1][i] = uValue;
  out[i + 1][i + 1] = "0";
  return out;
}

function inverseBChiMatrixA(rank, generator, zValue, uValue) {
  const out = identityMatrix(rank + 1);
  const i = generator - 1;
  out[i][i] = "0";
  out[i][i + 1] = divideExpressions("1", uValue);
  out[i + 1][i] = negateExpression(uValue);
  out[i + 1][i + 1] = multiplyExpressions(zValue, uValue);
  return out;
}

function positiveIndexD(index) {
  return index - 1;
}

function negativeIndexD(rank, index) {
  return 2 * rank - index;
}

function simpleRootEmbeddingD(rank, generator) {
  if (generator < rank) {
    return {
      root: `epsilon_${generator}-epsilon_${generator + 1}`,
      mainPair: [positiveIndexD(generator), positiveIndexD(generator + 1)],
      dualPair: [negativeIndexD(rank, generator + 1), negativeIndexD(rank, generator)],
      coordinate: [positiveIndexD(generator), positiveIndexD(generator + 1)],
    };
  }
  return {
    root: `epsilon_${rank - 1}+epsilon_${rank}`,
    mainPair: [positiveIndexD(rank - 1), negativeIndexD(rank, rank)],
    dualPair: [positiveIndexD(rank), negativeIndexD(rank, rank - 1)],
    coordinate: [positiveIndexD(rank - 1), negativeIndexD(rank, rank)],
  };
}

function xiMatrixD(rank, generator, parameter) {
  const embedding = simpleRootEmbeddingD(rank, generator);
  return embeddedDualBlockMatrix(2 * rank, embedding.mainPair, embedding.dualPair, [
    ["1", parameter],
    ["0", "1"],
  ]);
}

function bChiMatrixD(rank, generator, zValue, uValue) {
  const embedding = simpleRootEmbeddingD(rank, generator);
  return embeddedDualBlockMatrix(2 * rank, embedding.mainPair, embedding.dualPair, [
    [multiplyExpressions(zValue, uValue), negateExpression(divideExpressions("1", uValue))],
    [uValue, "0"],
  ]);
}

function inverseBChiMatrixD(rank, generator, zValue, uValue) {
  const embedding = simpleRootEmbeddingD(rank, generator);
  return embeddedDualBlockMatrix(2 * rank, embedding.mainPair, embedding.dualPair, [
    ["0", divideExpressions("1", uValue)],
    [negateExpression(uValue), multiplyExpressions(zValue, uValue)],
  ]);
}

function coordinatePinning(datum) {
  if (datum.family === "A") {
    return {
      available: true,
      family: "A",
      group: `SL_${datum.rank + 1}(C)`,
      label: `standard SL_${datum.rank + 1}(C) pinning`,
      description: "Simple root i is embedded in rows and columns i,i+1; B_i(z)=x_i(z) dot{s_i}.",
      matrixSize: datum.rank + 1,
      simpleRoots: Array.from({ length: datum.rank }, (_, idx) => `alpha_${idx + 1}=epsilon_${idx + 1}-epsilon_${idx + 2}`),
      xiMatrix: (generator, parameter) => xiMatrixA(datum.rank, generator, parameter),
      bChiMatrix: (generator, zValue, uValue) => bChiMatrixA(datum.rank, generator, zValue, uValue),
      inverseBChiMatrix: (generator, zValue, uValue) => inverseBChiMatrixA(datum.rank, generator, zValue, uValue),
      xiCoordinate: (matrix, generator) => matrixEntry(matrix, generator - 1, generator),
    };
  }
  if (datum.family === "D") {
    return {
      available: true,
      family: "D",
      group: `SO_${2 * datum.rank}(C)`,
      label: `standard SO_${2 * datum.rank}(C) Chevalley pinning`,
      description: "The basis is e_1,...,e_n,e_{-n},...,e_{-1}; the form pairs e_i with e_{-i}.",
      matrixSize: 2 * datum.rank,
      simpleRoots: Array.from({ length: datum.rank }, (_, idx) => simpleRootEmbeddingD(datum.rank, idx + 1).root),
      xiMatrix: (generator, parameter) => xiMatrixD(datum.rank, generator, parameter),
      bChiMatrix: (generator, zValue, uValue) => bChiMatrixD(datum.rank, generator, zValue, uValue),
      inverseBChiMatrix: (generator, zValue, uValue) => inverseBChiMatrixD(datum.rank, generator, zValue, uValue),
      xiCoordinate: (matrix, generator) => {
        const [row, col] = simpleRootEmbeddingD(datum.rank, generator).coordinate;
        return matrixEntry(matrix, row, col);
      },
    };
  }
  return {
    available: false,
    family: datum.family,
    group: "",
    label: `coordinate pinning not implemented for type ${datum.label}`,
    description: "",
    matrixSize: 0,
    simpleRoots: [],
  };
}

function multiplyMatrices(left, right) {
  const size = left.length;
  const out = zeroMatrix(size);
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const terms = [];
      for (let mid = 0; mid < size; mid += 1) {
        terms.push(multiplyExpressions(left[row][mid], right[mid][col]));
      }
      out[row][col] = addExpressions(...terms);
    }
  }
  return out;
}

function matrixEntry(matrix, row, col) {
  return matrix[row]?.[col] ?? "0";
}

function updateDashedMatrix(pinning, generator, zBottom, uBottom, currentY, zTop, uTop) {
  return multiplyMatrices(
    multiplyMatrices(pinning.inverseBChiMatrix(generator, zBottom, uBottom), currentY),
    pinning.bChiMatrix(generator, zTop, uTop),
  );
}

function computeZRowsAndDashedRays(pinning, words, moves, uRows, stepInfos, coordinatePrefix = "z") {
  const zRows = [words[0].map((_, idx) => `${coordinatePrefix}${idx + 1}`)];
  const dashedRays = [];
  const triInfoByIndex = new Map(
    stepInfos.filter((info) => !info.plus).map((info) => [info.triMoveIndex, info]),
  );

  moves.forEach((move, stripIdx) => {
    const rowz = zRows[zRows.length - 1];
    const rowu = uRows[stripIdx];
    const nextu = uRows[stripIdx + 1];
    const p = move.pos;
    if (move.type === "tetra") {
      zRows.push([
        ...rowz.slice(0, p),
        rowz[p + 1],
        rowz[p],
        ...rowz.slice(p + 2),
      ]);
      return;
    }
    if (move.type === "tri") {
      const denominator = multiplyExpressions(powerExpression(rowu[p], 2), rowz[p + 1]);
      const zSouth = subtractExpressions(rowz[p], divideExpressions("1", denominator));
      const nextz = [
        ...rowz.slice(0, p),
        zSouth,
      ];
      const color = words[stripIdx][p];
      const initialParameter = negateExpression(
        divideExpressions("1", multiplyExpressions(rowz[p + 1], powerExpression(rowu[p + 1], 2))),
      );
      let currentY = pinning.xiMatrix(color, initialParameter);
      const crossings = [];
      for (let topIdx = p + 2; topIdx < words[stripIdx].length; topIdx += 1) {
        const botIdx = topIdx - 1;
        const crossingColor = words[stripIdx][topIdx];
        const zTop = rowz[topIdx];
        const uTop = rowu[topIdx];
        const uBottom = nextu[botIdx];
        const xiEntry = pinning.xiCoordinate(currentY, crossingColor);
        const zBottom = addExpressions(zTop, xiEntry);
        const nextY = updateDashedMatrix(pinning, crossingColor, zBottom, uBottom, currentY, zTop, uTop);
        crossings.push({
          virtualIndex: crossings.length + 1,
          color: crossingColor,
          topEdge: topIdx + 1,
          bottomEdge: botIdx + 1,
          zTop,
          uTop,
          zBottom,
          uBottom,
          yBefore: currentY,
          yAfter: nextY,
          xiEntry,
        });
        nextz.push(zBottom);
        currentY = nextY;
      }
      zRows.push(nextz);
      const triInfo = triInfoByIndex.get(stripIdx);
      if (triInfo) {
        dashedRays.push({
          label: triInfo.clusterVariable,
          step: triInfo.step,
          triMoveIndex: stripIdx,
          color,
          initialY: pinning.xiMatrix(color, initialParameter),
          crossings,
          finalY: currentY,
        });
      }
      return;
    }
    if (move.type === "hexa") {
      const zNw = rowz[p];
      const zN = rowz[p + 1];
      const zNe = rowz[p + 2];
      const uNw = rowu[p];
      const uN = rowu[p + 1];
      const uNe = rowu[p + 2];
      const uSw = nextu[p];
      const uS = nextu[p + 1];
      const zSw = divideExpressions(multiplyExpressions(zNe, uNw), uN);
      const zSe = divideExpressions(multiplyExpressions(zNw, uS), uSw);
      const numeratorLeft = multiplyExpressions(zNw, zNe, powerExpression(uNw, 2), uNe);
      const numeratorRight = multiplyExpressions(zN, uSw, uS);
      const zS = divideExpressions(subtractExpressions(numeratorLeft, numeratorRight), multiplyExpressions(uNw, uS));
      zRows.push([
        ...rowz.slice(0, p),
        zSw,
        zS,
        zSe,
        ...rowz.slice(p + 3),
      ]);
      return;
    }
    throw new Error(`Unknown weave move type: ${move.type}`);
  });
  return { zRows, dashedRays };
}

class ExpressionExpansionError extends Error {}

const MAX_POLYNOMIAL_TERMS = 600;
const MAX_DENOMINATOR_FACTORS = 16;
const MAX_POLYNOMIAL_DIVISION_STEPS = 4000;

function naturalNameParts(name) {
  const match = /^([A-Za-z_]+)([0-9]+)$/.exec(name);
  if (!match) return [name, -1];
  return [match[1], Number(match[2])];
}

function compareVariableNames(left, right) {
  const [leftBase, leftIndex] = naturalNameParts(left);
  const [rightBase, rightIndex] = naturalNameParts(right);
  if (leftBase !== rightBase) return leftBase < rightBase ? -1 : 1;
  if (leftIndex !== rightIndex) return leftIndex - rightIndex;
  return left < right ? -1 : left > right ? 1 : 0;
}

function monomialKey(exponents) {
  return Object.entries(exponents)
    .filter(([, exponent]) => exponent !== 0)
    .sort(([left], [right]) => compareVariableNames(left, right))
    .map(([name, exponent]) => `${name}:${exponent}`)
    .join(";");
}

function keyToExponents(keyValue) {
  if (keyValue === "") return {};
  const out = {};
  keyValue.split(";").forEach((piece) => {
    const [name, exponent] = piece.split(":");
    out[name] = Number(exponent);
  });
  return out;
}

function cleanPolynomial(poly) {
  const out = new Map();
  poly.forEach((coefficient, keyValue) => {
    if (coefficient !== 0) out.set(keyValue, coefficient);
  });
  if (out.size > MAX_POLYNOMIAL_TERMS) {
    throw new ExpressionExpansionError("The expanded cluster expression is too large.");
  }
  return out;
}

function constantPolynomial(value) {
  return value === 0 ? new Map() : new Map([["", value]]);
}

function variablePolynomial(name) {
  return new Map([[monomialKey({ [name]: 1 }), 1]]);
}

function isZeroPolynomial(poly) {
  return cleanPolynomial(poly).size === 0;
}

function isOnePolynomial(poly) {
  const cleaned = cleanPolynomial(poly);
  return cleaned.size === 1 && cleaned.get("") === 1;
}

function addPolynomials(left, right) {
  const out = new Map(left);
  right.forEach((coefficient, keyValue) => {
    out.set(keyValue, (out.get(keyValue) ?? 0) + coefficient);
  });
  return cleanPolynomial(out);
}

function negatePolynomial(poly) {
  const out = new Map();
  poly.forEach((coefficient, keyValue) => out.set(keyValue, -coefficient));
  return cleanPolynomial(out);
}

function subtractPolynomials(left, right) {
  return addPolynomials(left, negatePolynomial(right));
}

function addExponents(leftKey, rightKey) {
  const out = keyToExponents(leftKey);
  Object.entries(keyToExponents(rightKey)).forEach(([name, exponent]) => {
    out[name] = (out[name] ?? 0) + exponent;
  });
  return monomialKey(out);
}

function multiplyPolynomials(left, right) {
  if (isZeroPolynomial(left) || isZeroPolynomial(right)) return constantPolynomial(0);
  const out = new Map();
  left.forEach((leftCoefficient, leftKey) => {
    right.forEach((rightCoefficient, rightKey) => {
      const keyValue = addExponents(leftKey, rightKey);
      out.set(keyValue, (out.get(keyValue) ?? 0) + leftCoefficient * rightCoefficient);
    });
  });
  return cleanPolynomial(out);
}

function powerPolynomial(poly, exponent) {
  if (exponent === 0) return constantPolynomial(1);
  let out = constantPolynomial(1);
  for (let idx = 0; idx < exponent; idx += 1) {
    out = multiplyPolynomials(out, poly);
  }
  return out;
}

function polynomialCanonicalKey(poly) {
  return [...cleanPolynomial(poly).entries()]
    .sort(([left], [right]) => compareMonomialKeys(left, right))
    .map(([keyValue, coefficient]) => `${keyValue}=${coefficient}`)
    .join("|");
}

function compareMonomialKeys(left, right) {
  const leftExp = keyToExponents(left);
  const rightExp = keyToExponents(right);
  const leftDegree = Object.values(leftExp).reduce((sum, value) => sum + value, 0);
  const rightDegree = Object.values(rightExp).reduce((sum, value) => sum + value, 0);
  if (leftDegree !== rightDegree) return rightDegree - leftDegree;
  const names = [...new Set([...Object.keys(leftExp), ...Object.keys(rightExp)])]
    .sort(compareVariableNames);
  for (const name of names) {
    const diff = (rightExp[name] ?? 0) - (leftExp[name] ?? 0);
    if (diff !== 0) return diff;
  }
  return left < right ? -1 : left > right ? 1 : 0;
}

function monomialDivides(divisorKey, dividendKey) {
  const divisor = keyToExponents(divisorKey);
  const dividend = keyToExponents(dividendKey);
  return Object.entries(divisor).every(([name, exponent]) => (dividend[name] ?? 0) >= exponent);
}

function subtractExponents(dividendKey, divisorKey) {
  const out = keyToExponents(dividendKey);
  Object.entries(keyToExponents(divisorKey)).forEach(([name, exponent]) => {
    out[name] = (out[name] ?? 0) - exponent;
  });
  return monomialKey(out);
}

function leadingTerm(poly) {
  const entries = [...cleanPolynomial(poly).entries()];
  if (entries.length === 0) return null;
  entries.sort(([left], [right]) => compareMonomialKeys(left, right));
  const [keyValue, coefficient] = entries[0];
  return { key: keyValue, coefficient };
}

function dividePolynomialExact(dividend, divisor) {
  const divisorClean = cleanPolynomial(divisor);
  if (isZeroPolynomial(divisorClean)) return null;
  if (isOnePolynomial(divisorClean)) return cleanPolynomial(dividend);

  let remainder = cleanPolynomial(dividend);
  let quotient = constantPolynomial(0);
  const divisorLead = leadingTerm(divisorClean);
  let steps = 0;

  while (!isZeroPolynomial(remainder)) {
    steps += 1;
    if (quotient.size > MAX_POLYNOMIAL_TERMS) {
      throw new ExpressionExpansionError("The expanded cluster expression is too large.");
    }
    if (steps > MAX_POLYNOMIAL_DIVISION_STEPS) {
      throw new ExpressionExpansionError("Polynomial cancellation is too large.");
    }
    const remainderLead = leadingTerm(remainder);
    if (!monomialDivides(divisorLead.key, remainderLead.key)) return null;
    if (remainderLead.coefficient % divisorLead.coefficient !== 0) return null;

    const termKey = subtractExponents(remainderLead.key, divisorLead.key);
    const termCoefficient = remainderLead.coefficient / divisorLead.coefficient;
    const term = new Map([[termKey, termCoefficient]]);
    quotient = addPolynomials(quotient, term);
    remainder = subtractPolynomials(remainder, multiplyPolynomials(term, divisorClean));
  }
  return cleanPolynomial(quotient);
}

function makeRational(num, denFactors = []) {
  let numerator = cleanPolynomial(num);
  if (isZeroPolynomial(numerator)) return { num: constantPolynomial(0), denFactors: [] };

  const remaining = [];
  denFactors.forEach((factor) => {
    const cleanedFactor = cleanPolynomial(factor);
    if (isOnePolynomial(cleanedFactor)) return;
    const quotient = dividePolynomialExact(numerator, cleanedFactor);
    if (quotient) {
      numerator = quotient;
    } else {
      remaining.push(cleanedFactor);
    }
  });
  if (remaining.length > MAX_DENOMINATOR_FACTORS) {
    throw new ExpressionExpansionError("The expanded cluster denominator is too large.");
  }
  return { num: numerator, denFactors: remaining };
}

function rationalFromInteger(value) {
  return makeRational(constantPolynomial(value));
}

function cloneRational(value) {
  return makeRational(new Map(value.num), value.denFactors.map((factor) => new Map(factor)));
}

function multiplyRationals(left, right) {
  return makeRational(
    multiplyPolynomials(left.num, right.num),
    [...left.denFactors, ...right.denFactors],
  );
}

function negateRational(value) {
  return makeRational(negatePolynomial(value.num), value.denFactors);
}

function denominatorProduct(value) {
  return value.denFactors.reduce(
    (product, factor) => multiplyPolynomials(product, factor),
    constantPolynomial(1),
  );
}

function addRationals(left, right) {
  const leftScale = denominatorProduct(right);
  const rightScale = denominatorProduct(left);
  return makeRational(
    addPolynomials(
      multiplyPolynomials(left.num, leftScale),
      multiplyPolynomials(right.num, rightScale),
    ),
    [...left.denFactors, ...right.denFactors],
  );
}

function subtractRationals(left, right) {
  return addRationals(left, negateRational(right));
}

function divideRationals(left, right) {
  if (isZeroPolynomial(right.num)) throw new Error("Division by zero in cluster-variable calculation.");
  const numerator = right.denFactors.reduce(
    (product, factor) => multiplyPolynomials(product, factor),
    left.num,
  );
  return makeRational(numerator, [...left.denFactors, right.num]);
}

function powerRational(value, exponent) {
  if (exponent < 0) {
    return divideRationals(rationalFromInteger(1), powerRational(value, -exponent));
  }
  let out = rationalFromInteger(1);
  for (let idx = 0; idx < exponent; idx += 1) out = multiplyRationals(out, value);
  return out;
}

function formatMonomial(keyValue) {
  const exponents = keyToExponents(keyValue);
  const pieces = Object.entries(exponents)
    .sort(([left], [right]) => compareVariableNames(left, right))
    .map(([name, exponent]) => (exponent === 1 ? name : `${name}^${exponent}`));
  return pieces.length === 0 ? "1" : pieces.join("*");
}

function formatPolynomial(poly) {
  const entries = [...cleanPolynomial(poly).entries()]
    .sort(([left], [right]) => compareMonomialKeys(left, right));
  if (entries.length === 0) return "0";

  return entries.map(([keyValue, coefficient], idx) => {
    const absCoefficient = Math.abs(coefficient);
    const monomial = formatMonomial(keyValue);
    const unsigned = monomial === "1"
      ? String(absCoefficient)
      : absCoefficient === 1
        ? monomial
        : `${absCoefficient}*${monomial}`;
    if (idx === 0) return coefficient < 0 ? `-${unsigned}` : unsigned;
    return coefficient < 0 ? ` - ${unsigned}` : ` + ${unsigned}`;
  }).join("");
}

function formatPolynomialFactor(poly) {
  const text = formatPolynomial(poly);
  return cleanPolynomial(poly).size <= 1 ? text : `(${text})`;
}

function formatRational(value) {
  const simplified = makeRational(value.num, value.denFactors);
  if (simplified.denFactors.length === 0) return formatPolynomial(simplified.num);
  const denominator = simplified.denFactors.map(formatPolynomialFactor).join("*");
  return `${formatPolynomialFactor(simplified.num)}/${denominator}`;
}

function tokenizeExpression(expr) {
  const tokens = [];
  let idx = 0;
  while (idx < expr.length) {
    const char = expr[idx];
    if (/\s/.test(char)) {
      idx += 1;
      continue;
    }
    if ("()+-*/^".includes(char)) {
      tokens.push({ type: char, value: char });
      idx += 1;
      continue;
    }
    const numberMatch = /^[0-9]+/.exec(expr.slice(idx));
    if (numberMatch) {
      tokens.push({ type: "number", value: numberMatch[0] });
      idx += numberMatch[0].length;
      continue;
    }
    const nameMatch = /^[A-Za-z_][A-Za-z0-9_]*/.exec(expr.slice(idx));
    if (nameMatch) {
      tokens.push({ type: "name", value: nameMatch[0] });
      idx += nameMatch[0].length;
      continue;
    }
    throw new Error(`Could not parse expression near "${expr.slice(idx)}".`);
  }
  return tokens;
}

function parseRationalExpression(expr, substitutions = new Map()) {
  const tokens = tokenizeExpression(expr);
  let cursor = 0;

  function peek(type = null) {
    const token = tokens[cursor] ?? null;
    if (type === null) return token;
    return token?.type === type;
  }

  function consume(type) {
    if (!peek(type)) throw new Error(`Expected "${type}" while parsing "${expr}".`);
    const token = tokens[cursor];
    cursor += 1;
    return token;
  }

  function parseExpression() {
    let out = parseTerm();
    while (peek("+") || peek("-")) {
      const op = consume(peek("+") ? "+" : "-").type;
      const right = parseTerm();
      out = op === "+" ? addRationals(out, right) : subtractRationals(out, right);
    }
    return out;
  }

  function parseTerm() {
    let out = parsePower();
    while (peek("*") || peek("/")) {
      const op = consume(peek("*") ? "*" : "/").type;
      const right = parsePower();
      out = op === "*" ? multiplyRationals(out, right) : divideRationals(out, right);
    }
    return out;
  }

  function parsePower() {
    let out = parseUnary();
    if (peek("^")) {
      consume("^");
      const exponentToken = consume("number");
      out = powerRational(out, Number(exponentToken.value));
    }
    return out;
  }

  function parseUnary() {
    if (peek("-")) {
      consume("-");
      return negateRational(parseUnary());
    }
    return parsePrimary();
  }

  function parsePrimary() {
    if (peek("number")) {
      return rationalFromInteger(Number(consume("number").value));
    }
    if (peek("name")) {
      const name = consume("name").value;
      if (substitutions.has(name)) return cloneRational(substitutions.get(name));
      return makeRational(variablePolynomial(name));
    }
    consume("(");
    const out = parseExpression();
    consume(")");
    return out;
  }

  const out = parseExpression();
  if (cursor !== tokens.length) throw new Error(`Unexpected token while parsing "${expr}".`);
  return out;
}

function computeClusterValues(words, moves, uRows, zRows, stepInfos) {
  const substitutions = new Map();
  return stepInfos
    .filter((info) => !info.plus)
    .map((info) => {
      const stripIdx = info.triMoveIndex;
      const move = moves[stripIdx];
      const p = move.pos;
      const baseValue = {
        label: info.clusterVariable,
        step: info.step,
        entryLabel: info.entryLabel,
        triMoveIndex: stripIdx,
        edge: p + 1,
        color: words[stripIdx][p],
        symbolic_u_s: uRows[stripIdx + 1][p],
        symbolic_z_s: zRows[stripIdx + 1][p],
        symbolic_u_nw: uRows[stripIdx][p],
        symbolic_u_ne: uRows[stripIdx][p + 1],
        symbolic_z_nw: zRows[stripIdx][p],
        symbolic_z_ne: zRows[stripIdx][p + 1],
      };

      try {
        const zNe = parseRationalExpression(zRows[stripIdx][p + 1], substitutions);
        const uNw = parseRationalExpression(uRows[stripIdx][p], substitutions);
        const uNe = parseRationalExpression(uRows[stripIdx][p + 1], substitutions);
        const expanded = multiplyRationals(multiplyRationals(zNe, uNw), uNe);
        substitutions.set(info.clusterVariable, expanded);
        const zSouth = parseRationalExpression(zRows[stripIdx + 1][p], substitutions);

        return {
          ...baseValue,
          expression: formatRational(expanded),
          u_s: formatRational(expanded),
          z_s: formatRational(zSouth),
          u_nw: formatRational(uNw),
          u_ne: formatRational(uNe),
          z_nw: formatRational(parseRationalExpression(zRows[stripIdx][p], substitutions)),
          z_ne: formatRational(zNe),
          expansionWarning: "",
        };
      } catch (error) {
        if (!(error instanceof ExpressionExpansionError)) throw error;
        substitutions.delete(info.clusterVariable);
        const expression = multiplyExpressions(zRows[stripIdx][p + 1], uRows[stripIdx][p], uRows[stripIdx][p + 1]);
        return {
          ...baseValue,
          expression,
          u_s: expression,
          z_s: zRows[stripIdx + 1][p],
          u_nw: uRows[stripIdx][p],
          u_ne: uRows[stripIdx][p + 1],
          z_nw: zRows[stripIdx][p],
          z_ne: zRows[stripIdx][p + 1],
          expansionWarning: "The expanded expression is large, so the recursive expression is displayed.",
        };
      }
    });
}

function det3Rows(r1, r2, r3) {
  return r1[0] * (r2[1] * r3[2] - r2[2] * r3[1])
    - r1[1] * (r2[0] * r3[2] - r2[2] * r3[0])
    + r1[2] * (r2[0] * r3[1] - r2[1] * r3[0]);
}

function simpleRootVector(rank, generator) {
  const out = Array(rank).fill(0);
  out[generator - 1] = 1;
  return out;
}

function reflectRootVector(vector, generator, cartan) {
  const out = vector.slice();
  const idx = generator - 1;
  let pair = 0;
  for (let col = 0; col < vector.length; col += 1) {
    pair += cartan[idx][col] * vector[col];
  }
  out[idx] -= pair;
  return out;
}

function pairingRoot(left, right, cartan) {
  let out = 0;
  for (let i = 0; i < left.length; i += 1) {
    for (let j = 0; j < right.length; j += 1) {
      out += left[i] * cartan[i][j] * right[j];
    }
  }
  return out;
}

function bottomRootSequence(word, datum) {
  const cartan = datum.cartan;
  const prefix = [];
  const roots = [];
  word.forEach((generator) => {
    let root = simpleRootVector(datum.rank, generator);
    prefix.forEach((reflection) => {
      root = reflectRootVector(root, reflection, cartan);
    });
    roots.push(root);
    prefix.push(generator);
  });
  return { roots, cartan };
}

function signInt(value) {
  if (value > 0) return 1;
  if (value < 0) return -1;
  return 0;
}

function boundaryIntersection(bottomWord, row1, row2, datum) {
  const { roots, cartan } = bottomRootSequence(bottomWord, datum);
  let total = 0;
  for (let i = 0; i < bottomWord.length; i += 1) {
    for (let j = 0; j < bottomWord.length; j += 1) {
      total += 0.5
        * signInt((j + 1) - (i + 1))
        * (row1[i] ?? 0)
        * (row2[j] ?? 0)
        * pairingRoot(roots[i], roots[j], cartan);
    }
  }
  return total;
}

function formatQuiverWeight(value) {
  if (Math.abs(value - Math.round(value)) < 1e-9) return Math.round(value);
  if (Math.abs(value * 2 - Math.round(value * 2)) < 1e-9) {
    return `${Math.round(value * 2)}/2`;
  }
  return Number(value.toFixed(6));
}

function quiverWeightNumeric(value) {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.includes("/")) {
    const [num, den] = value.split("/").map(Number);
    return num / den;
  }
  return Number(value);
}

function computeQuiverData(words, moves, cycles, dashedRays, datum) {
  const labels = cycles.map((cycle) => cycle.label);
  const cycleLookup = new Map(cycles.map((cycle) => [cycle.label, cycle]));
  const frozen = cycles
    .filter((cycle) => cycle.cycleRows[cycle.cycleRows.length - 1].some((weight) => weight !== 0))
    .map((cycle) => cycle.label);
  const frozenSet = new Set(frozen);
  const exchangeable = labels.filter((label) => !frozenSet.has(label));
  const epsilon = Object.fromEntries(labels.map((label) => [
    label,
    Object.fromEntries(labels.map((other) => [other, 0])),
  ]));
  const contributions = Object.fromEntries(labels.map((label) => [
    label,
    Object.fromEntries(labels.map((other) => [other, []])),
  ]));

  function pushContribution(list, entry) {
    if (Math.abs(entry.numericValue) < 1e-9) return;
    list.push({
      ...entry,
      value: formatQuiverWeight(entry.numericValue),
    });
  }

  labels.forEach((a) => {
    labels.forEach((b) => {
      if (a === b) return;
      const ca = cycleLookup.get(a).cycleRows;
      const cb = cycleLookup.get(b).cycleRows;
      let total = 0;
      const pairContributions = [];

      moves.forEach((move, stripIdx) => {
        const p = move.pos;
        if (move.type === "tri") {
          const localValue = det3Rows(
            [1, 1, 1],
            [ca[stripIdx][p], ca[stripIdx + 1][p], ca[stripIdx][p + 1]],
            [cb[stripIdx][p], cb[stripIdx + 1][p], cb[stripIdx][p + 1]],
          );
          total += localValue;
          pushContribution(pairContributions, {
            kind: "tri",
            moveType: move.type,
            stripIdx,
            pos: p,
            numericValue: localValue,
          });
        } else if (move.type === "hexa") {
          const topValue = 0.5 * det3Rows(
            [1, 1, 1],
            [ca[stripIdx][p], ca[stripIdx][p + 1], ca[stripIdx][p + 2]],
            [cb[stripIdx][p], cb[stripIdx][p + 1], cb[stripIdx][p + 2]],
          );
          const bottomValue = -0.5 * det3Rows(
            [1, 1, 1],
            [ca[stripIdx + 1][p], ca[stripIdx + 1][p + 1], ca[stripIdx + 1][p + 2]],
            [cb[stripIdx + 1][p], cb[stripIdx + 1][p + 1], cb[stripIdx + 1][p + 2]],
          );
          const localValue = topValue + bottomValue;
          total += localValue;
          pushContribution(pairContributions, {
            kind: "hexa",
            moveType: move.type,
            stripIdx,
            pos: p,
            numericValue: localValue,
          });
        }
      });

      const boundaryValue = boundaryIntersection(words[words.length - 1], ca[ca.length - 1], cb[cb.length - 1], datum);
      total += boundaryValue;
      pushContribution(pairContributions, {
        kind: "bottom-boundary",
        numericValue: boundaryValue,
      });
      contributions[a][b] = pairContributions;
      epsilon[a][b] = frozenSet.has(a) && frozenSet.has(b) ? 0 : formatQuiverWeight(total);
    });
  });

  const colors = Object.fromEntries(dashedRays.map((ray) => [ray.label, ray.color]));
  const arrows = [];
  labels.forEach((a) => {
    labels.forEach((b) => {
      if (a === b) return;
      if (frozenSet.has(a) && frozenSet.has(b)) return;
      const rawValue = epsilon[a][b];
      const numericValue = quiverWeightNumeric(rawValue);
      if (numericValue > 0) {
        arrows.push({
          source: a,
          target: b,
          weight: rawValue,
          contributions: contributions[a][b],
        });
      }
    });
  });
  return { labels, epsilon, arrows, frozen, exchangeable, colors, contributions };
}

function sourceCoordinateNames(rxwLength, uLength) {
  return [
    ...Array.from({ length: rxwLength }, (_, idx) => `w${idx + 1}`),
    ...Array.from({ length: uLength }, (_, idx) => `z${idx + 1}`),
  ];
}

function computeTopCoordinateRows(topWeave) {
  const rows = [sourceCoordinateNames(topWeave.rxw.length, topWeave.u.length)];
  topWeave.moves.forEach((move, stripIdx) => {
    const row = rows[stripIdx];
    const p = move.pos;
    if (move.type === "tetra") {
      rows.push([
        ...row.slice(0, p),
        row[p + 1],
        row[p],
        ...row.slice(p + 2),
      ]);
      return;
    }
    if (move.type === "hexa") {
      rows.push([
        ...row.slice(0, p),
        row[p + 2],
        subtractExpressions(multiplyExpressions(row[p], row[p + 2]), row[p + 1]),
        row[p],
        ...row.slice(p + 3),
      ]);
      return;
    }
    throw new Error("The top weave should contain only 4-valent and 6-valent moves.");
  });
  return rows;
}

function tokenizeForSubstitution(expr) {
  return tokenizeExpression(expr).map((token) => token.value);
}

function substituteExpressionText(expr, substitutions) {
  const tokens = tokenizeForSubstitution(expr);
  return tokens.map((token) => {
    if (/^[A-Za-z_][A-Za-z0-9_]*$/.test(token) && substitutions[token]) {
      return wrapExpression(substitutions[token]);
    }
    return token;
  }).join("");
}

function expandExpressionText(expr, substitutionsObject = {}) {
  const substitutions = new Map(
    Object.entries(substitutionsObject).map(([name, value]) => [
      name,
      parseRationalExpression(value),
    ]),
  );
  try {
    return formatRational(parseRationalExpression(String(expr ?? ""), substitutions));
  } catch (error) {
    if (!(error instanceof ExpressionExpansionError)) throw error;
    return substituteExpressionText(String(expr ?? ""), substitutionsObject);
  }
}

function computeFullClusterValues(clusterValues, coordinateSubstitution) {
  const substitutions = new Map(
    Object.entries(coordinateSubstitution).map(([name, expr]) => [
      name,
      parseRationalExpression(expr),
    ]),
  );

  return clusterValues.map((value) => {
    try {
      const whole = parseRationalExpression(value.expression, substitutions);
      return {
        ...value,
        middleExpression: value.expression,
        expression: formatRational(whole),
        substitutionWarning: value.expansionWarning ?? "",
      };
    } catch (error) {
      if (!(error instanceof ExpressionExpansionError)) throw error;
      return {
        ...value,
        middleExpression: value.expression,
        expression: substituteExpressionText(value.expression, coordinateSubstitution),
        substitutionWarning: "The substituted expression is large, so an unsimplified substituted expression is displayed.",
      };
    }
  });
}

function placeholderZRows(words) {
  return words.map((word, rowIdx) => word.map((_, edgeIdx) => `y${rowIdx + 1}_${edgeIdx + 1}`));
}

function placeholderClusterValues(stepInfos) {
  return stepInfos
    .filter((info) => !info.plus)
    .map((info) => ({
      label: info.clusterVariable,
      step: info.step,
      entryLabel: info.entryLabel,
      triMoveIndex: info.triMoveIndex,
      expression: "",
      expansionWarning: "Coordinate formulas are not implemented for this type.",
    }));
}

function buildDoubleInductiveWeave(doubleString, datum) {
  let words = [[]];
  const moves = [];
  const stepInfos = [];
  let currentElement = identityCoxeterElement(datum);
  let currentReducedWord = [];
  let clusterCount = 0;

  doubleString.forEach((entry, idx) => {
    const step = idx + 1;
    const generator = entry.h;
    const side = entry.side;
    let insertedBottomWord;
    let nextPermutationCandidate;

    if (side === "L") {
      words = words.map((row) => [generator, ...row]);
      moves.forEach((move) => {
        move.pos += 1;
      });
      insertedBottomWord = [generator, ...currentReducedWord];
      nextPermutationCandidate = leftMultiplySimpleReflection(currentElement, generator, datum);
    } else {
      words = words.map((row) => [...row, generator]);
      insertedBottomWord = [...currentReducedWord, generator];
      nextPermutationCandidate = rightMultiplySimpleReflection(currentElement, generator, datum);
    }

    const oldLength = coxeterLength(currentElement, datum);
    const candidateLength = coxeterLength(nextPermutationCandidate, datum);
    const plus = candidateLength === oldLength + 1;

    if (plus) {
      currentElement = nextPermutationCandidate;
      currentReducedWord = insertedBottomWord;
      stepInfos.push({
        step,
        entryLabel: entryLabel(entry),
        generator,
        side,
        plus: true,
        clusterVariable: null,
        triMoveIndex: null,
        bottomReducedWordAfterStep: currentReducedWord.slice(),
      });
      return;
    }

    if (datum.family === "A") {
      const shorter = reducedWordFromCoxeterElement(nextPermutationCandidate, datum);
      const pretriWord = side === "L"
        ? [generator, generator, ...shorter]
        : [...shorter, generator, generator];
      const posttriWord = side === "L"
        ? [generator, ...shorter]
        : [...shorter, generator];
      const triPos = side === "L" ? 0 : shorter.length;
      const path = fastBraidPathBetweenWords(insertedBottomWord, pretriWord, datum);
      for (let pathIdx = 1; pathIdx < path.words.length; pathIdx += 1) {
        words.push(path.words[pathIdx]);
        moves.push({
          ...path.moves[pathIdx - 1],
          sourceStep: step,
          entryLabel: entryLabel(entry),
        });
      }
      words.push(posttriWord);
      moves.push({
        type: "tri",
        pos: triPos,
        sourceStep: step,
        entryLabel: entryLabel(entry),
      });
      const triMoveIndex = moves.length - 1;
      clusterCount += 1;
      currentReducedWord = posttriWord;
      stepInfos.push({
        step,
        entryLabel: entryLabel(entry),
        generator,
        side,
        plus: false,
        clusterVariable: `A${clusterCount}`,
        triMoveIndex,
        bottomReducedWordAfterStep: currentReducedWord.slice(),
      });
      return;
    }

    const path = braidPathToSideDescent(currentReducedWord, generator, side, datum);
    for (let pathIdx = 1; pathIdx < path.words.length; pathIdx += 1) {
      const row = side === "L"
        ? [generator, ...path.words[pathIdx]]
        : [...path.words[pathIdx], generator];
      words.push(row);
      moves.push({
        ...path.moves[pathIdx - 1],
        pos: path.moves[pathIdx - 1].pos + (side === "L" ? 1 : 0),
        sourceStep: step,
        entryLabel: entryLabel(entry),
      });
    }

    const descentWord = path.words[path.words.length - 1];
    const posttriWord = descentWord.slice();
    const triPos = side === "L" ? 0 : descentWord.length - 1;
    words.push(posttriWord);
    moves.push({
      type: "tri",
      pos: triPos,
      sourceStep: step,
      entryLabel: entryLabel(entry),
    });
    const triMoveIndex = moves.length - 1;
    clusterCount += 1;
    currentReducedWord = posttriWord;
    stepInfos.push({
      step,
      entryLabel: entryLabel(entry),
      generator,
      side,
      plus: false,
      clusterVariable: `A${clusterCount}`,
      triMoveIndex,
      bottomReducedWordAfterStep: currentReducedWord.slice(),
    });
  });

  const lusztigCycles = computeAllLusztigCycles(words, moves, stepInfos);
  const uRows = computeURows(words, lusztigCycles);
  const pinning = coordinatePinning(datum);
  const coordinateAvailable = pinning.available;
  const { zRows, dashedRays } = coordinateAvailable
    ? computeZRowsAndDashedRays(pinning, words, moves, uRows, stepInfos, "y")
    : { zRows: placeholderZRows(words), dashedRays: [] };
  const clusterValues = coordinateAvailable
    ? computeClusterValues(words, moves, uRows, zRows, stepInfos)
    : placeholderClusterValues(stepInfos);
  const quiverData = computeQuiverData(words, moves, lusztigCycles, dashedRays, datum);

  return {
    rank: datum.rank,
    dynkin: datum,
    coordinateAvailable,
    pinningInfo: {
      family: pinning.family,
      group: pinning.group,
      label: pinning.label,
      description: pinning.description,
      matrixSize: pinning.matrixSize,
      simpleRoots: pinning.simpleRoots,
    },
    doubleString,
    words,
    moves,
    finalReducedWord: currentReducedWord,
    demazureElement: currentElement,
    stepInfos,
    lusztigCycles,
    uRows,
    zRows,
    dashedRays,
    clusterValues,
    quiverData,
  };
}

function buildDoubleInductiveWeaveA(doubleString, rank) {
  return buildDoubleInductiveWeave(doubleString, createDynkinDatum({ family: "A", rank }));
}

function buildTopWeave({ datum, rxw, u, c }) {
  const words = [[...rxw, ...u]];
  const moves = [];
  const stepInfos = [];
  let leftPrefix = [];

  for (let idx = 0; idx < c - 1; idx += 1) {
    const generator = u[idx];
    const starred = datum.star.get(generator);
    const suffix = u.slice(idx + 1);
    const localStart = [...rxw, generator];
    const localTarget = [starred, ...rxw];
    const path = fastBraidPathBetweenWords(localStart, localTarget, datum);

    for (let pathIdx = 1; pathIdx < path.words.length; pathIdx += 1) {
      const move = path.moves[pathIdx - 1];
      moves.push({
        ...move,
        pos: move.pos + leftPrefix.length,
        sourceStep: idx + 1,
        entryLabel: `${generator}->${starred}`,
      });
      words.push([...leftPrefix, ...path.words[pathIdx], ...suffix]);
    }

    leftPrefix = [...leftPrefix, starred];
    stepInfos.push({
      sourceStep: idx + 1,
      generator,
      starred,
      targetPrefix: leftPrefix.slice(),
    });
  }

  const topWeave = {
    rank: datum.rank,
    dynkin: datum,
    rxw: rxw.slice(),
    u: u.slice(),
    c,
    words,
    moves,
    stepInfos,
    sourceWord: [...rxw, ...u],
    targetWord: words[words.length - 1].slice(),
  };
  const coordinateRows = computeTopCoordinateRows(topWeave);
  topWeave.coordinateRows = coordinateRows;
  topWeave.coordinateSubstitution = Object.fromEntries(
    coordinateRows[coordinateRows.length - 1].map((expr, idx) => [`y${idx + 1}`, expr]),
  );
  topWeave.sourceCoordinates = coordinateRows[0].slice();
  return topWeave;
}

function buildTopWeaveA({ rank, rxw, u, c }) {
  return buildTopWeave({ datum: createDynkinDatum({ family: "A", rank }), rxw, u, c });
}

return { expandExpressionText, computeFullClusterValues, buildDoubleInductiveWeave, buildDoubleInductiveWeaveA, buildTopWeave, buildTopWeaveA };
})();

const __core = (() => {
const { buildDoubleInductiveWeave, buildTopWeave, computeFullClusterValues, expandExpressionText } = __weave;
const { createDynkinDatum, normalizeDynkinFamily, randomHalfTwistWordForDatum, validateSequenceInDynkin } = __dynkin;

const defaultExample = {
  family: "A",
  rank: 3,
  r: "6",
  u: "2 3 1 2 2 1",
  rxw: "1 2 1 3 2 1",
  c: "3",
  lr: "L R L R R",
};

function randomInteger(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function parseOptionalPositiveInteger(value, name, fallback) {
  if (value === null || value === undefined || String(value).trim() === "") {
    return fallback;
  }
  return parsePositiveInteger(value, name);
}

function assertPositiveInteger(value, name) {
  if (!Number.isInteger(value) || value < 1) {
    throw new Error(`${name} must be a positive integer.`);
  }
}

function parseIntegerSequence(text, name = "sequence") {
  const normalized = String(text ?? "")
    .replace(/[()[\]{}]/g, " ")
    .replace(/,/g, " ")
    .trim();
  if (normalized === "") return [];
  const tokens = normalized.split(/\s+/);
  return tokens.map((token) => {
    if (!/^[1-9][0-9]*$/.test(token)) {
      throw new Error(`${name} contains an invalid entry "${token}".`);
    }
    return Number.parseInt(token, 10);
  });
}

function parseLRSequence(text) {
  const normalized = String(text ?? "")
    .replace(/\\mathcal\{L\}|\\calL|calL/g, " L ")
    .replace(/\\mathcal\{R\}|\\calR|calR/g, " R ")
    .replace(/[()[\]{},]/g, " ")
    .trim();
  if (normalized === "") return [];
  if (/^[LRlr\s]+$/.test(normalized)) {
    return normalized.replace(/\s+/g, "").toUpperCase().split("");
  }
  const tokens = normalized.split(/\s+/);
  return tokens.map((token) => {
    const value = token.toUpperCase();
    if (value !== "L" && value !== "R") {
      throw new Error(`LR sequence contains an invalid entry "${token}".`);
    }
    return value;
  });
}

function parsePositiveInteger(text, name) {
  const value = Number.parseInt(String(text ?? "").trim(), 10);
  assertPositiveInteger(value, name);
  return value;
}

function previousOrSameWithColor(u, position, color) {
  for (let idx = position; idx >= 1; idx -= 1) {
    if (u[idx - 1] === color) return idx;
  }
  return null;
}

function nextOrSameWithColor(u, position, color) {
  for (let idx = position; idx <= u.length; idx += 1) {
    if (u[idx - 1] === color) return idx;
  }
  return null;
}

function starA(index, rank) {
  const datum = createDynkinDatum({ family: "A", rank });
  assertPositiveInteger(index, "index");
  if (index > rank) throw new Error(`index ${index} is outside type A_${rank}.`);
  return datum.star.get(index);
}

function standardHalfTwistWord(rank, family = "A") {
  return createDynkinDatum({ family, rank }).standardHalfTwistWord.slice();
}

function randomHalfTwistWord(rank, family = "A") {
  return randomHalfTwistWordForDatum(createDynkinDatum({ family, rank }));
}

function randomExample({ family = "A", rank = null, r = null } = {}) {
  const parsedFamily = normalizeDynkinFamily(family);
  const defaultRank = parsedFamily === "A" ? randomInteger(2, 5) : parsedFamily === "D" ? 4 : 6;
  const parsedRank = parseOptionalPositiveInteger(rank, "n", defaultRank);
  const datum = createDynkinDatum({ family: parsedFamily, rank: parsedRank });
  const parsedR = parseOptionalPositiveInteger(r, "r", Math.max(2, parsedRank + 2));
  const u = Array.from({ length: parsedR }, () => randomInteger(1, parsedRank));
  const lr = Array.from({ length: parsedR - 1 }, () => (Math.random() < 0.5 ? "L" : "R"));
  const c = lr.filter((move) => move === "L").length + 1;
  return {
    family: parsedFamily,
    rank: String(parsedRank),
    r: String(parsedR),
    u: u.join(" "),
    rxw: (parsedFamily === "D" || parsedFamily === "E" ? datum.standardHalfTwistWord : randomHalfTwistWordForDatum(datum)).join(" "),
    c: String(c),
    lr: lr.join(" "),
  };
}

function associatedBox(u, envelope, direction) {
  const [left, right] = envelope;
  if (direction === "L") {
    const color = u[left - 1];
    const boxRight = previousOrSameWithColor(u, right, color);
    if (boxRight === null || boxRight < left) {
      throw new Error(`Cannot form [${left},${right}} from the current expression sequence.`);
    }
    return [left, boxRight];
  }
  const color = u[right - 1];
  const boxLeft = nextOrSameWithColor(u, left, color);
  if (boxLeft === null || boxLeft > right) {
    throw new Error(`Cannot form {${left},${right}] from the current expression sequence.`);
  }
  return [boxLeft, right];
}

function intervalText([left, right]) {
  return `[${left},${right}]`;
}

function wrapExpressionText(expr) {
  if (expr === "1" || /^[A-Za-z0-9_]+(\^[0-9]+)?$/.test(expr)) return expr;
  return `(${expr})`;
}

function multiplyExpressionText(...factors) {
  const useful = factors.filter((factor) => factor !== "1");
  if (useful.length === 0) return "1";
  if (useful.includes("0")) return "0";
  return useful.map(wrapExpressionText).join("*");
}

function subtractExpressionText(left, right) {
  if (right === "0") return left;
  if (left === "0") return `-${wrapExpressionText(right)}`;
  return `${wrapExpressionText(left)} - ${wrapExpressionText(right)}`;
}

function divideExpressionText(numerator, denominator) {
  if (denominator === "1") return numerator;
  return `${wrapExpressionText(numerator)}/${wrapExpressionText(denominator)}`;
}

function strictlyNextSameColor(u, index) {
  const color = u[index - 1];
  for (let pos = index + 1; pos <= u.length; pos += 1) {
    if (u[pos - 1] === color) return pos;
  }
  return Infinity;
}

function strictlyPreviousSameColor(u, index) {
  const color = u[index - 1];
  for (let pos = index - 1; pos >= 1; pos -= 1) {
    if (u[pos - 1] === color) return pos;
  }
  return -Infinity;
}

function nearestColorRight(u, index, color) {
  for (let pos = index; pos <= u.length; pos += 1) {
    if (u[pos - 1] === color) return pos;
  }
  return Infinity;
}

function nearestColorLeft(u, index, color) {
  for (let pos = index; pos >= 1; pos -= 1) {
    if (u[pos - 1] === color) return pos;
  }
  return -Infinity;
}

function intervalDisplayOrEmpty(interval) {
  return interval === null ? "∅" : intervalText(interval);
}

function computeDeterminantialModules({ datum, u, chain }) {
  const memo = new Map();
  const data = new Map();

  function adjacentColors(color) {
    return datum.adjacency.get(color) ?? [];
  }

  function normalizeInterval(a, b) {
    if (!Number.isFinite(a) || !Number.isFinite(b) || a > b) return null;
    return [a, b];
  }

  function intervalKey(interval) {
    return interval === null ? "empty" : `${interval[0]},${interval[1]}`;
  }

  function compute(interval) {
    if (interval === null) return {
      interval,
      expression: "1",
      base: true,
      empty: true,
    };
    const [a, b] = interval;
    const cacheKey = intervalKey(interval);
    if (memo.has(cacheKey)) return memo.get(cacheKey);
    if (u[a - 1] !== u[b - 1]) {
      throw new Error(`Cannot compute M${intervalText(interval)} because it is not an i-box.`);
    }

    let result;
    if (a === b) {
      result = {
        interval,
        expression: `C_${a}`,
        base: true,
        empty: false,
      };
    } else {
      const inner = normalizeInterval(strictlyNextSameColor(u, a), strictlyPreviousSameColor(u, b));
      const left = normalizeInterval(strictlyNextSameColor(u, a), b);
      const right = normalizeInterval(a, strictlyPreviousSameColor(u, b));
      const correctionIntervals = adjacentColors(u[a - 1])
        .map((color) => normalizeInterval(nearestColorRight(u, a, color), nearestColorLeft(u, b, color)))
        .filter((item) => item !== null);

      const leftData = compute(left);
      const rightData = compute(right);
      const innerData = compute(inner);
      const correctionData = correctionIntervals.map((item) => compute(item));
      const correction = multiplyExpressionText(...correctionData.map((item) => item.expression));
      const numerator = subtractExpressionText(
        multiplyExpressionText(leftData.expression, rightData.expression),
        correction,
      );
      let expression;
      try {
        expression = expandExpressionText(divideExpressionText(numerator, innerData.expression));
      } catch {
        expression = divideExpressionText(numerator, innerData.expression);
      }
      result = {
        interval,
        expression,
        base: false,
        empty: false,
        left,
        right,
        inner,
        correctionIntervals,
        leftExpression: leftData.expression,
        rightExpression: rightData.expression,
        innerExpression: innerData.expression,
        correctionExpression: correction,
      };
    }
    memo.set(cacheKey, result);
    data.set(cacheKey, result);
    return result;
  }

  const rows = chain.rows.map((row) => {
    const value = compute(row.box);
    return {
      t: row.t,
      interval: row.box.slice(),
      color: row.color,
      expression: value.expression,
      calculation: value,
    };
  });

  return {
    rows,
    all: [...data.values()].filter((item) => !item.empty),
    intervalDisplay: intervalDisplayOrEmpty,
  };
}

function makeAdmissibleChain({ datum, u, c, lr }) {
  const r = u.length;
  if (r === 0) throw new Error("u must be nonempty.");
  validateSequenceInDynkin(u, datum, "u");
  if (lr.length !== r - 1) {
    throw new Error(`LR sequence must have length ${r - 1}, but has length ${lr.length}.`);
  }

  const expectedC = lr.filter((move) => move === "L").length + 1;
  if (c !== expectedC) {
    throw new Error(`For this LR sequence, the initial envelope must be c=${expectedC}.`);
  }

  const firstByColor = new Map();
  const lastByColor = new Map();
  u.forEach((color, idx) => {
    const pos = idx + 1;
    if (!firstByColor.has(color)) firstByColor.set(color, pos);
    lastByColor.set(color, pos);
  });

  let envelope = [c, c];
  const rows = [];
  for (let t = 1; t <= r; t += 1) {
    const previousMove = t === 1 ? "R" : lr[t - 2];
    if (t > 1) {
      if (previousMove === "L") envelope = [envelope[0] - 1, envelope[1]];
      else envelope = [envelope[0], envelope[1] + 1];
    }
    if (envelope[0] < 1 || envelope[1] > r) {
      throw new Error(`Envelope ${intervalText(envelope)} is outside [1,${r}].`);
    }
    const effectiveEnd = t === 1 ? c : (previousMove === "L" ? envelope[0] : envelope[1]);
    const box = associatedBox(u, envelope, previousMove);
    const color = u[box[0] - 1];
    if (u[box[1] - 1] !== color) {
      throw new Error(`Internal error: ${intervalText(box)} is not an i-box.`);
    }
    const side = previousMove === "L" ? "L" : "R";
    const h = side === "L" ? datum.star.get(color) : color;
    rows.push({
      t,
      previousMove,
      envelope: envelope.slice(),
      effectiveEnd,
      box,
      color,
      frozen: box[0] === firstByColor.get(color) && box[1] === lastByColor.get(color),
      h,
      side,
      boxNotation: previousMove === "L"
        ? `[${envelope[0]},${envelope[1]}}`
        : `{${envelope[0]},${envelope[1]}]`,
    });
  }

  return {
    family: datum.family,
    rank: datum.rank,
    dynkin: datum,
    u: u.slice(),
    c,
    lr: lr.slice(),
    range: rows[rows.length - 1].envelope.slice(),
    rows,
  };
}

function makeDoubleString({ datum, rxw, chain }) {
  validateSequenceInDynkin(rxw, datum, "rxw");
  const prefix = rxw.map((entry, idx) => ({
    source: "rxw",
    t: idx + 1,
    h: entry,
    side: "R",
    plus: true,
  }));
  const chainEntries = chain.rows.map((row) => ({
    source: "chain",
    t: row.t,
    h: row.h,
    side: row.side,
    plus: false,
    color: row.color,
    box: row.box.slice(),
  }));
  return [...prefix, ...chainEntries];
}

function sequenceFromDoubleString(doubleString) {
  const out = [];
  doubleString.forEach((entry) => {
    if (entry.side === "L") out.unshift(entry.h);
    else out.push(entry.h);
  });
  return out;
}

function summarizeDoubleString(doubleString, rxwLength) {
  const prefix = doubleString.slice(0, rxwLength);
  const chainEntries = doubleString.slice(rxwLength);
  return {
    prefix,
    chainEntries,
    leftPart: chainEntries.filter((entry) => entry.side === "L").reverse().map((entry) => entry.h),
    rightPart: chainEntries.filter((entry) => entry.side === "R").map((entry) => entry.h),
    uiSequence: sequenceFromDoubleString(doubleString),
  };
}

function formatDoubleStringEntry(entry) {
  return `${entry.h}${entry.side}${entry.plus ? "+" : ""}`;
}

function buildTrace(input) {
  const family = normalizeDynkinFamily(input.family ?? input.type ?? "A");
  const rank = parsePositiveInteger(input.rank, "rank");
  const datum = createDynkinDatum({ family, rank });
  const u = parseIntegerSequence(input.u, "u");
  const rxw = parseIntegerSequence(input.rxw, "rxw");
  const lr = parseLRSequence(input.lr);
  const c = input.c === "" || input.c === null || input.c === undefined
    ? lr.filter((move) => move === "L").length + 1
    : parsePositiveInteger(input.c, "c");
  const chain = makeAdmissibleChain({ datum, u, c, lr });
  const determinantialModules = computeDeterminantialModules({ datum, u, chain });
  const doubleString = makeDoubleString({ datum, rxw, chain });
  const doubleSummary = summarizeDoubleString(doubleString, rxw.length);
  if (family === "D" && datum.positiveRoots.length > 20) {
    throw new Error(`The reduced expression Δ̲ for ${datum.label} is computed, but rendering D_6 and higher currently requires an optimized braid-path algorithm. The public page supports D_4 and D_5 reliably.`);
  }
  if (family === "E" && (rank !== 6 || input.experimentalE !== true)) {
    throw new Error(`The reduced expression Δ̲ for ${datum.label} has been computed, but browser rendering is currently enabled only for type A, type D, and preset type E_6 experiments.`);
  }
  if (family !== "A" && family !== "D" && family !== "E") {
    throw new Error(`The reduced expression Δ̲ for ${datum.label} has been computed, but browser rendering is currently enabled only for type A and type D.`);
  }
  const topWeave = buildTopWeave({ datum, rxw, u, c });
  const bottomWeave = buildDoubleInductiveWeave(doubleString, datum);
  const shouldExpandFullClusterValues = bottomWeave.coordinateAvailable && u.length <= 12 && bottomWeave.clusterValues.length <= 12;
  const fullClusterValues = shouldExpandFullClusterValues
    ? computeFullClusterValues(bottomWeave.clusterValues, topWeave.coordinateSubstitution)
    : [];
  return {
    family,
    dynkin: datum,
    rank,
    u,
    rxw,
    c,
    expectedC: lr.filter((move) => move === "L").length + 1,
    lr,
    chain,
    determinantialModules,
    doubleString,
    doubleSummary,
    topWeave,
    bottomWeave,
    fullClusterValues,
    fullClusterValuesOmitted: !shouldExpandFullClusterValues,
    fullClusterValuesOmittedReason: bottomWeave.coordinateAvailable
      ? "The expanded expression is large."
      : "Coordinate formulas are not implemented for this type.",
  };
}

function intervalTextForDisplay(interval) {
  return intervalText(interval);
}

return { defaultExample, parseIntegerSequence, parseLRSequence, parsePositiveInteger, starA, standardHalfTwistWord, randomHalfTwistWord, randomExample, makeAdmissibleChain, makeDoubleString, sequenceFromDoubleString, summarizeDoubleString, formatDoubleStringEntry, buildTrace, intervalTextForDisplay };
})();

const __top_weave_layout = (() => {

function clamp01(value) {
  return Math.min(1, Math.max(0, value));
}

function smoothstep(value) {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function sameWord(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right)) return false;
  if (left.length !== right.length) return false;
  return left.every((entry, idx) => Number(entry) === Number(right[idx]));
}

function topWeaveTargetCheck(topWeave, bottomSourceWord) {
  const targetWord = topWeave?.targetWord ?? topWeave?.words?.[topWeave.words.length - 1] ?? [];
  return {
    ok: sameWord(targetWord, bottomSourceWord),
    targetWord: targetWord.slice(),
    bottomSourceWord: bottomSourceWord.slice(),
  };
}

function buildTopWeaveLayout({
  topWeave,
  sourceXs,
  targetXs,
  topY,
  targetY,
}) {
  const words = topWeave?.words ?? [];
  const moves = topWeave?.moves ?? [];
  if (words.length === 0) return { rows: [], strips: [] };

  const wordLength = words[0].length;
  if (sourceXs.length !== wordLength || targetXs.length !== wordLength) {
    throw new Error("Top weave boundary anchors must match the top weave word length.");
  }

  const rowDenominator = Math.max(words.length - 1, 1);
  const rows = words.map((word, rowIdx) => {
    const position = rowIdx / rowDenominator;
    const xAmount = smoothstep(position);
    return {
      word: word.slice(),
      y: lerp(topY, targetY, position),
      xs: word.map((_, idx) => lerp(sourceXs[idx], targetXs[idx], xAmount)),
    };
  });

  const strips = moves.map((move, idx) => ({
    move,
    before: rows[idx],
    after: rows[idx + 1],
  }));

  return { rows, strips };
}

return { topWeaveTargetCheck, buildTopWeaveLayout };
})();

const { buildTrace, defaultExample, parseIntegerSequence, randomExample, standardHalfTwistWord } = __core;
const { buildTopWeaveLayout, topWeaveTargetCheck } = __top_weave_layout;

const SVG_NS = "http://www.w3.org/2000/svg";

const form = document.querySelector("#input-form");
const rankInput = document.querySelector("#rank-input");
const rInput = document.querySelector("#r-input");
const uInput = document.querySelector("#u-input");
const rxwInput = document.querySelector("#rxw-input");
const lrInput = document.querySelector("#lr-input");
const randomButton = document.querySelector("#random-button");
const errorBox = document.querySelector("#error-box");
const film = document.querySelector("#story-film");
const svg = document.querySelector("#story-svg");
const progressFill = document.querySelector("#story-progress-fill");
const playButton = document.querySelector("#story-play-button");
const captionBox = document.querySelector("#story-caption");
const NARRATION_AUDIO_VERSION = "samantha-125-v2";
const pageParams = new URLSearchParams(window.location.search);
const embedMode = window.STORY_MODE_EMBED === true || pageParams.get("embed") === "1";
const debugAnchors = pageParams.get("debug") === "1";
const MOTION_SPEED_MULTIPLIER = 2;

const MARKS = {
  introHold: 0.10,
  introClearEnd: 0.22,
  wordFocusEnd: 0.36,
  wordEnd: 0.62,
  deltaFocusEnd: 0.78,
  deltaEnd: 1.04,
  lrFocusEnd: 1.20,
  lrEnd: 1.48,
  countEnd: 1.92,
  locateEnd: 2.54,
  chainStart: 2.68,
  chainEnd: 7.00,
  step2Start: 7.34,
  step2ArrangeEnd: 7.68,
  step2DeltaEnd: 8.10,
  step2RInitEnd: 8.50,
};

// Scene grammar: delete, focus, move, transform, and retire use disjoint windows.
// No two actions should compete for attention in the same time window.
// When a scene feels wrong, first check whether two of these phases overlap.
const APPEND_SPAN = 1.45;
const APPEND_GAP = 0.18;
const ROW_RETIRE_SPAN = 0.08;
const SDELTA_LIFT_SPAN = 0.14;
const IDELTA_DELTA_SPAN = 0.18;
const IDELTA_ENTRY_SPAN = 1.85;
const FINAL_CLEANUP_SPAN = 0.32;
const FINAL_CONFIRM_SPAN = 0.30;
const STEP3_SDELTA_PARK_SPAN = 0.38;
const STEP3_LIFT_SPAN = 0.48;
const STEP3_STRAND_SPAN = 0.46;
const STEP3_STRIP_SPAN = 3.45;
const STEP3_TRI_STRIP_GAP = 0.10;
const STEP3_PREP_STRIP_SPAN = 1.55;
const STEP3_PREP_STRIP_GAP = 0.03;
const STEP4_PREP_DELAY = 0.22;
const STEP4_BOTTOM_MOVE_SPAN = 0.72;
const STEP4_BOUNDARY_SPAN = 0.62;
const STEP4_TOP_REVEAL_DELAY = 0.18;
const STEP4_TOP_REVEAL_SPAN = 3.05;
const STEP4_FINAL_CLEAN_SPAN = 1.18;
const STEP4_FINAL_LABEL_SPAN = 0.78;
const PLAYBACK_DURATION_MS = 180000;

let trace = null;
let story = null;
let targetProgress = 0;
let displayProgress = 0;
let rafId = null;
let keyboardRafId = null;
let keyboardAnimating = false;
let pendingKeyboardDirection = 0;
let playbackRafId = null;
let playbackPlaying = false;
let playbackRunId = 0;
let playbackWaitResolve = null;
let playbackJumping = false;
let narrationCues = [];
let narrationCueIndex = 0;
let narrationAudioElements = [];
let currentNarrationAudio = null;
let narrationAudioQueue = [];
let narrationAudioRunId = 0;
let narrationAudioUnlocked = false;
let forcedProgress = null;
let storyEnd = MARKS.step2RInitEnd;
let keyboardStops = [];
let trivalentStops = [];
let trivalentRecords = [];

function clamp(value, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value));
}

function smoothstep(value) {
  const x = clamp(value);
  return x * x * (3 - 2 * x);
}

function fade(progress, start, end) {
  return smoothstep((progress - start) / Math.max(0.0001, end - start));
}

function fadeOut(progress, start, end) {
  return 1 - fade(progress, start, end);
}

function lerp(a, b, amount) {
  return a + (b - a) * amount;
}

function active(progress, start, end) {
  return progress >= start && progress <= end;
}

function svgEl(tag, attrs = {}, text = "") {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== null && value !== undefined) node.setAttribute(key, String(value));
  });
  if (text !== "") node.textContent = text;
  return node;
}

function setAttrs(node, attrs) {
  Object.entries(attrs).forEach(([key, value]) => node.setAttribute(key, String(value)));
}

function setOpacity(node, value) {
  node.style.opacity = String(clamp(value));
}

function setTransform(node, x, y, scale = 1) {
  node.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})`);
}

function setDashProgress(node, value) {
  node.style.strokeDashoffset = String((1 - clamp(value)).toFixed(4));
}

function setSourceHighlight(node, value) {
  void value;
  node.style.strokeWidth = "";
  node.style.filter = "";
}

function rowPositions(length, center, spacing) {
  return Array.from({ length }, (_, idx) => center + (idx - (length - 1) / 2) * spacing);
}

function intervalText(interval) {
  return `[${interval[0]},${interval[1]}]`;
}

function addText(parent, x, y, text, className = "story-text") {
  const node = svgEl("text", { class: className, x, y }, text);
  parent.appendChild(node);
  return node;
}

function makeToken(parent, text, x, y, className = "symbol-token") {
  const group = svgEl("g", { class: className });
  group.appendChild(svgEl("text", { x: 0, y: 0 }, String(text)));
  setTransform(group, x, y);
  parent.appendChild(group);
  return { group, text, x, y };
}

function makeSourceLabel(parent, sourceIndex, x, y) {
  const group = svgEl("g", { class: "idelta-source-label" });
  const label = String(sourceIndex + 1);
  const rect = svgEl("rect", {
    x: -18,
    y: -18,
    width: 36,
    height: 24,
    rx: 6,
    ry: 6,
  });
  const text = svgEl("text", {
    x: 0,
    y: -5,
    "text-anchor": "middle",
    "dominant-baseline": "middle",
  });
  text.appendChild(svgEl("tspan", {}, "c"));
  text.appendChild(svgEl("tspan", {
    "baseline-shift": "sub",
    "font-size": "11",
  }, label));
  group.append(rect, text);
  setTransform(group, x, y);
  parent.appendChild(group);
  setOpacity(group, 0);
  return { group, sourceIndex };
}

function makeColorCarrier(parent, color, text, x, y) {
  const group = svgEl("g", { class: "append-carrier" });
  group.appendChild(svgEl("circle", { class: `${colorClass(color)} append-carrier-dot`, cx: 0, cy: 0, r: 16 }));
  group.appendChild(svgEl("text", { x: 0, y: 1 }, String(text)));
  setTransform(group, x, y);
  parent.appendChild(group);
  return { group, color, text, x, y };
}

function makeLabel(parent, text, x, y, className = "story-formula-label") {
  const node = svgEl("text", { class: className, x, y }, text);
  parent.appendChild(node);
  return node;
}

function appendUnderlinedDelta(parent, x, y, options = {}) {
  const {
    className = "svg-underlined-delta",
    lineClass = "svg-underlined-delta-line",
    scale = 1,
    anchor = "middle",
  } = options;
  const text = svgEl("text", { class: className, x, y, "text-anchor": anchor }, "Δ");
  const width = 20 * scale;
  const yOffset = 10 * scale;
  const line = svgEl("line", {
    class: lineClass,
    x1: x - width / 2,
    y1: y + yOffset,
    x2: x + width / 2,
    y2: y + yOffset,
  });
  parent.append(text, line);
  return { text, line };
}

function makeUnderlinedDeltaLabel(parent, x, y, className = "story-main-label") {
  const group = svgEl("g", { class: `${className} underlined-delta-label` });
  appendUnderlinedDelta(group, -34, 0, {
    className: "underlined-delta-symbol",
    lineClass: "underlined-delta-rule",
    scale: 1.18,
  });
  group.appendChild(svgEl("text", { class: "underlined-delta-equals", x: 0, y: 0, "text-anchor": "end" }, "="));
  setTransform(group, x, y, 1);
  parent.appendChild(group);
  return group;
}

function makeUnderlinedDeltaTitle(parent, x, y, className = "story-object-delta") {
  const group = svgEl("g", { class: `${className} underlined-delta-title` });
  appendUnderlinedDelta(group, 0, 0, {
    className: "underlined-delta-symbol",
    lineClass: "underlined-delta-rule",
    scale: 1.18,
  });
  setTransform(group, x, y, 1);
  parent.appendChild(group);
  return group;
}

function makeUnderlinedDeltaObject(parent, x, y, className = "story-object-delta") {
  const group = svgEl("g", { class: `${className} underlined-delta-object` });
  appendUnderlinedDelta(group, -34, 0, {
    className: "underlined-delta-symbol",
    lineClass: "underlined-delta-rule",
    scale: 1.24,
  });
  group.appendChild(svgEl("text", { class: "underlined-delta-equals", x: 0, y: 0, "text-anchor": "end" }, "="));
  setTransform(group, x, y, 1);
  parent.appendChild(group);
  return group;
}

function makeStep2Label(parent, x, y) {
  const group = svgEl("g", { class: "step2-label" });
  group.appendChild(svgEl("text", { x, y }, "s"));
  appendUnderlinedDelta(group, x + 24, y + 8, {
    className: "step2-subscript",
    lineClass: "step2-subscript-rule",
    scale: 0.72,
  });
  group.appendChild(svgEl("text", { x: x + 48, y }, "(C) ="));
  parent.appendChild(group);
  return group;
}

function makeIDeltaLabel(parent, x, y) {
  const group = svgEl("g", { class: "idelta-label" });
  group.appendChild(svgEl("text", { x, y }, "i"));
  appendUnderlinedDelta(group, x + 19, y + 7, {
    className: "idelta-label-subscript",
    lineClass: "idelta-label-subscript-rule",
    scale: 0.64,
  });
  group.appendChild(svgEl("text", { x: x + 40, y }, "(C) ="));
  parent.appendChild(group);
  return group;
}

function colorClass(color) {
  return `row-color-dot color-${((Number(color) - 1) % 4) + 1}`;
}

function sideClass(side) {
  return side === "L" ? "side-l" : "side-r";
}

function generatorColorValue(color) {
  const palette = ["#1f5fbf", "#b5292f", "#17834d", "#7d4bb3"];
  return palette[((Number(color) - 1) % palette.length + palette.length) % palette.length];
}

function clusterIndexText(label, fallback) {
  const match = String(label ?? "").match(/\d+$/);
  return match ? match[0] : String(fallback);
}

function storyEntryLabel(entry) {
  return `${entry.h}${entry.side}${entry.plus ? "+" : ""}`;
}

function storyGeneratorsAdjacent(datum, left, right) {
  return (datum.adjacency.get(left) ?? []).includes(right);
}

function storyWordHasSideDescent(word, generator, side) {
  return side === "L"
    ? word[0] === generator
    : word[word.length - 1] === generator;
}

function storyReducedWordNeighbors(word, datum) {
  const out = [];
  for (let pos = 0; pos < word.length - 1; pos += 1) {
    const a = word[pos];
    const b = word[pos + 1];
    if (a !== b && !storyGeneratorsAdjacent(datum, a, b)) {
      out.push({
        word: [...word.slice(0, pos), b, a, ...word.slice(pos + 2)],
        move: { type: "tetra", pos },
      });
    }
  }
  for (let pos = 0; pos < word.length - 2; pos += 1) {
    const a = word[pos];
    const b = word[pos + 1];
    const c = word[pos + 2];
    if (a === c && storyGeneratorsAdjacent(datum, a, b)) {
      out.push({
        word: [...word.slice(0, pos), b, a, b, ...word.slice(pos + 3)],
        move: { type: "hexa", pos },
      });
    }
  }
  return out;
}

function storySideDescentScore(word, generator, side, depth) {
  const targetIdx = side === "L" ? 0 : word.length - 1;
  let nearest = Infinity;
  word.forEach((value, idx) => {
    if (value === generator) nearest = Math.min(nearest, Math.abs(idx - targetIdx));
  });
  const edgeBonus = storyWordHasSideDescent(word, generator, side) ? 10000 : 0;
  return edgeBonus - 120 * nearest - depth;
}

function storyReconstructPath(targetKey, records) {
  const words = [];
  const moves = [];
  let cursor = targetKey;
  while (cursor !== null) {
    const record = records.get(cursor);
    words.push(record.word.slice());
    if (record.move) moves.push(record.move);
    cursor = record.parent;
  }
  words.reverse();
  moves.reverse();
  return { words, moves };
}

function storyBraidPathToSideDescent(startWord, generator, side, datum) {
  if (storyWordHasSideDescent(startWord, generator, side)) {
    return { words: [startWord.slice()], moves: [], found: true };
  }
  const startKey = startWord.join(",");
  const records = new Map([[startKey, { parent: null, move: null, word: startWord.slice() }]]);
  let frontier = [{ key: startKey, word: startWord.slice(), score: storySideDescentScore(startWord, generator, side, 0) }];
  const maxDepth = Math.max(14, startWord.length * 4);
  const beamWidth = 900;

  for (let depth = 1; depth <= maxDepth; depth += 1) {
    const candidates = new Map();
    frontier.forEach((state) => {
      storyReducedWordNeighbors(state.word, datum).forEach((neighbor) => {
        const neighborKey = neighbor.word.join(",");
        if (records.has(neighborKey)) return;
        const score = storySideDescentScore(neighbor.word, generator, side, depth);
        const previous = candidates.get(neighborKey);
        if (!previous || score > previous.score) {
          candidates.set(neighborKey, {
            key: neighborKey,
            word: neighbor.word,
            parent: state.key,
            move: neighbor.move,
            score,
          });
        }
      });
    });
    const ranked = [...candidates.values()]
      .sort((left, right) => right.score - left.score)
      .slice(0, beamWidth);
    for (const entry of ranked) {
      records.set(entry.key, {
        parent: entry.parent,
        move: entry.move,
        word: entry.word,
      });
      if (storyWordHasSideDescent(entry.word, generator, side)) {
        return { ...storyReconstructPath(entry.key, records), found: true };
      }
    }
    if (ranked.length === 0) break;
    frontier = ranked;
  }

  return { words: [startWord.slice()], moves: [], found: false };
}

function buildStoryActivePreparationStripItems(nextTrace, triLimit = Number.POSITIVE_INFINITY) {
  const words = [[]];
  const moves = [];
  const triInfos = new Map();
  let currentWord = [];
  let clusterCount = 0;
  let stopped = false;

  nextTrace.doubleString.forEach((entry, idx) => {
    const step = idx + 1;
    const generator = entry.h;
    const side = entry.side;

    if (side === "L") {
      words.forEach((row, rowIdx) => {
        words[rowIdx] = [generator, ...row];
      });
      moves.forEach((move) => {
        move.pos += 1;
        if (move.sourceTopIdx !== null && move.sourceTopIdx !== undefined) move.sourceTopIdx += 1;
        if (move.sourceBotIdx !== null && move.sourceBotIdx !== undefined) move.sourceBotIdx += 1;
      });
      if (!stopped && entry.plus) currentWord = [generator, ...currentWord];
    } else {
      words.forEach((row, rowIdx) => {
        words[rowIdx] = [...row, generator];
      });
      if (!stopped && entry.plus) currentWord = [...currentWord, generator];
    }

    if (stopped || entry.plus) return;

    if (clusterCount >= triLimit) {
      stopped = true;
      return;
    }

    const path = storyBraidPathToSideDescent(currentWord, generator, side, nextTrace.dynkin);
    if (!path.found) {
      stopped = true;
      return;
    }

    for (let pathIdx = 1; pathIdx < path.words.length; pathIdx += 1) {
      const move = path.moves[pathIdx - 1];
      const beforeRow = side === "L"
        ? [generator, ...path.words[pathIdx - 1]]
        : [...path.words[pathIdx - 1], generator];
      const afterRow = side === "L"
        ? [generator, ...path.words[pathIdx]]
        : [...path.words[pathIdx], generator];
      words.push(side === "L"
        ? [generator, ...path.words[pathIdx]]
        : [...path.words[pathIdx], generator]);
      moves.push({
        ...move,
        pos: move.pos + (side === "L" ? 1 : 0),
        sourceStep: step,
        entryLabel: storyEntryLabel(entry),
        sourceSide: side,
        sourceGenerator: generator,
        sourceTopIdx: side === "L" ? 0 : beforeRow.length - 1,
        sourceBotIdx: side === "L" ? 0 : afterRow.length - 1,
      });
    }

    const descentWord = path.words[path.words.length - 1] ?? currentWord;
    const beforeTri = side === "L"
      ? [generator, ...descentWord]
      : [...descentWord, generator];
    const triPos = side === "L" ? 0 : descentWord.length - 1;
    words.push(descentWord.slice());
    moves.push({
      type: "tri",
      pos: triPos,
      sourceStep: step,
      entryLabel: storyEntryLabel(entry),
      sourceSide: side,
      sourceGenerator: generator,
      sourceTopIdx: side === "L" ? 0 : beforeTri.length - 1,
      sourceBotIdx: null,
    });
    const triMoveIndex = moves.length - 1;
    clusterCount += 1;
    triInfos.set(triMoveIndex, {
      clusterVariable: `A${clusterCount}`,
      step,
      entryLabel: storyEntryLabel(entry),
    });
    currentWord = descentWord.slice();
  });

  return moves.map((move, idx) => ({
    move,
    before: words[idx] ?? [],
    after: words[idx + 1] ?? [],
    triInfo: triInfos.get(idx) ?? null,
  }));
}

function renderStory(nextTrace) {
  svg.replaceChildren();
  svg.appendChild(svgEl("rect", { class: "story-bg", x: 0, y: 0, width: 1440, height: 860 }));
  const defs = svgEl("defs");
  svg.appendChild(defs);

  const baseLayer = svgEl("g", { class: "story-layer base-layer" });
  const chainLayer = svgEl("g", { class: "story-layer chain-layer" });
  const step2Layer = svgEl("g", { class: "story-layer step2-layer" });
  const iDeltaLayer = svgEl("g", { class: "story-layer idelta-layer" });
  const step3Layer = svgEl("g", { class: "story-layer step3-layer" });
  const step4Layer = svgEl("g", { class: "story-layer step4-layer" });
  svg.append(baseLayer, chainLayer, step2Layer, step3Layer, iDeltaLayer, step4Layer);

  const u = nextTrace.u;
  const rxw = nextTrace.rxw;
  const lr = nextTrace.lr;
  const rows = nextTrace.chain.rows;
  const chainEntries = nextTrace.doubleString.slice(rxw.length);
  const step3ExactStripItems = buildStoryActivePreparationStripItems(nextTrace);
  const step3MergeSceneData = [];
  const appendEnd = MARKS.step2RInitEnd
    + APPEND_SPAN * chainEntries.length
    + APPEND_GAP * Math.max(chainEntries.length - 1, 0);
  const sdeltaLiftStart = appendEnd + ROW_RETIRE_SPAN;
  const sdeltaLiftEnd = sdeltaLiftStart + SDELTA_LIFT_SPAN;
  const iDeltaDeltaEnd = sdeltaLiftEnd + IDELTA_DELTA_SPAN;
  const iDeltaEntriesEnd = iDeltaDeltaEnd + IDELTA_ENTRY_SPAN * chainEntries.length;
  const finalCleanupStart = iDeltaEntriesEnd - IDELTA_ENTRY_SPAN * 0.04;
  const finalCleanupEnd = finalCleanupStart + FINAL_CLEANUP_SPAN;
  const finalConfirmStart = finalCleanupEnd + 0.06;
  const finalConfirmEnd = finalConfirmStart + FINAL_CONFIRM_SPAN;
  const step3SDeltaParkStart = finalConfirmEnd + 0.12;
  const step3SDeltaParkEnd = step3SDeltaParkStart + STEP3_SDELTA_PARK_SPAN;
  const step3Start = step3SDeltaParkEnd + 0.10;
  const step3LiftEnd = step3Start + STEP3_LIFT_SPAN;
  const step3StrandStart = step3LiftEnd + 0.08;
  const step3StrandEnd = step3StrandStart + STEP3_STRAND_SPAN;
  const step3StripStart = step3StrandEnd + 0.10;
  const step3StripTimings = [];
  let step3TimingCursor = step3StripStart;
  step3ExactStripItems.forEach((item) => {
    const isTri = item.move.type === "tri";
    const span = isTri ? STEP3_STRIP_SPAN : STEP3_PREP_STRIP_SPAN;
    const gap = isTri ? STEP3_TRI_STRIP_GAP : STEP3_PREP_STRIP_GAP;
    step3StripTimings.push({ start: step3TimingCursor, span, isTri });
    step3TimingCursor += span + gap;
  });
  const step3End = step3StripTimings.length > 0
    ? step3StripTimings[step3StripTimings.length - 1].start + step3StripTimings[step3StripTimings.length - 1].span
    : step3StrandEnd;
  const step4Start = step3End + STEP4_PREP_DELAY;
  const step4BottomMoveEnd = step4Start + STEP4_BOTTOM_MOVE_SPAN;
  const step4BoundaryEnd = step4BottomMoveEnd + STEP4_BOUNDARY_SPAN;
  const step4BoundaryStart = step4BottomMoveEnd - 0.08;
  const step4TopRevealStart = step4BoundaryEnd + STEP4_TOP_REVEAL_DELAY;
  const step4TopRevealEnd = step4TopRevealStart + STEP4_TOP_REVEAL_SPAN;
  const step4FinalCleanStart = step4TopRevealEnd + 0.55;
  const step4FinalCleanEnd = step4FinalCleanStart + STEP4_FINAL_CLEAN_SPAN;
  const step4FinalLabelStart = step4FinalCleanEnd - 0.04;
  const step4FinalEnd = step4FinalLabelStart + STEP4_FINAL_LABEL_SPAN;
  storyEnd = step4FinalEnd;
  const phaseMarks = {
    handoffStart: step3LiftEnd,
    doubleStart: step3LiftEnd,
    straightStrandStop: step3StrandStart + STEP3_STRAND_SPAN * 0.70,
    topBoundaryStart: step4BoundaryStart,
    topBoundaryEnd: step4BoundaryEnd,
    topRevealStart: step4TopRevealStart,
    topRevealEnd: step4TopRevealEnd,
    concatStart: step4FinalCleanStart,
    concatEnd: step4FinalCleanEnd,
    topStart: step4Start,
    finalEnd: step4FinalEnd,
  };
  narrationCues = [];
  let localKeyboardStops = [];
  let localTrivalentStops = [];
  let localTrivalentRecords = [];
  const c = nextTrace.c;
  const lIndices = lr
    .map((entry, idx) => (entry === "L" ? idx : null))
    .filter((idx) => idx !== null);

  const introChainY = 270;
  const introWordY = 330;
  const introLRY = 398;
  const introDeltaY = 366;
  const introDeltaTokenY = 366;
  const introITokenSpacing = 58;
  const introDeltaTokenSpacing = 44;
  const introLRSpacing = 52;
  const introRoleX = 452;
  const iIntroLabelX = 425;
  const deltaIntroLabelX = 1010;
  const lrIntroLabelX = 425;
  const iIntroStartX = 500;
  const deltaIntroStartX = 1065;
  const lrIntroStartX = 540;

  const chainIntroRole = addText(baseLayer, 0, 0, "", "story-object-caption");
  const chainIntroLabel = makeLabel(baseLayer, "C", 560, introChainY, "story-object-symbol");
  const chainIntroText = addText(
    baseLayer,
    0,
    introChainY,
    "",
    "story-chain-intro-arrow",
  );
  const chainIntroDet = addText(baseLayer, 820, introChainY, "", "story-chain-intro-subtext");
  const chainIntroI = addText(baseLayer, 0, introChainY, "", "story-chain-intro-math story-chain-intro-source");
  const chainIntroTail = addText(baseLayer, 0, 0, "", "story-chain-intro-subtext");

  const iIntroPrefix = addText(baseLayer, 0, 0, "", "story-role-label");
  const iLabel = makeLabel(baseLayer, "𝐢 =", iIntroLabelX, introWordY, "story-main-label");
  const iSuffix = addText(baseLayer, 0, 0, "", "story-intro-text");

  const deltaIntroPrefix = addText(baseLayer, 0, 0, "", "story-object-caption");
  const deltaObjectLabel = makeUnderlinedDeltaObject(baseLayer, deltaIntroLabelX, introDeltaY, "story-object-delta");
  const deltaLabel = makeUnderlinedDeltaObject(baseLayer, deltaIntroLabelX, introDeltaY, "story-object-delta");
  const deltaSuffix = addText(baseLayer, 0, 0, "", "story-intro-text");

  const cIntroPrefix = addText(baseLayer, 0, 0, "", "story-role-label");
  const lrLabel = makeLabel(baseLayer, "H =", lrIntroLabelX, introLRY, "story-main-label story-lr-label");
  const cGroupBrace = addText(baseLayer, 835, 364, "}", "story-c-group-brace");
  const cGroupLabel = makeLabel(baseLayer, "C", 885, 364, "story-object-symbol story-c-group-label");

  const iTokens = u.map((entry, idx) => makeToken(baseLayer, entry, iIntroStartX + idx * introITokenSpacing, introWordY, "symbol-token i-token"));
  const deltaTokens = rxw.map((entry, idx) => makeToken(baseLayer, entry, deltaIntroStartX + idx * introDeltaTokenSpacing, introDeltaTokenY, "symbol-token delta-token"));
  const lrTokens = lr.map((entry, idx) => makeToken(baseLayer, entry, lrIntroStartX + idx * introLRSpacing, introLRY, `lr-token ${sideClass(entry)}`));

  const workingLabelX = 470;
  const wordSpacing = Math.max(44, Math.min(58, 520 / Math.max(u.length - 1, 1)));
  const wordXs = rowPositions(u.length, 690, wordSpacing);
  const wordY = 245;
  const wordLabelX = workingLabelX;

  const deltaSpacing = Math.max(30, Math.min(42, 270 / Math.max(rxw.length - 1, 1)));
  const deltaX0 = 1068;
  const deltaY = 98;
  const deltaLabelX = 996;

  const lrSpacing = Math.max(40, Math.min(52, 300 / Math.max(lr.length - 1, 1)));
  const lrXs = rowPositions(lr.length, 690, lrSpacing);
  const lrY = 306;
  const lrLabelX = workingLabelX;

  const lCenterX = lIndices.length > 0
    ? lIndices.reduce((sum, idx) => sum + lrXs[idx], 0) / lIndices.length
    : lrXs[0] ?? 780;
  const cFormulaX = workingLabelX + 78;
  const cFormulaY = lrY + 78;
  const countText = addText(baseLayer, cFormulaX + 86, lrY + 48, `#L = ${lIndices.length}`, "count-label count-summary");
  const cMarker = makeToken(baseLayer, "c", cFormulaX, cFormulaY, "c-marker");
  const cFormulaPieces = [
    addText(baseLayer, cFormulaX + 34, cFormulaY, "=", "count-label c-formula c-formula-eq"),
    addText(baseLayer, cFormulaX + 78, cFormulaY, "#L", "count-label c-formula c-formula-main"),
    addText(baseLayer, cFormulaX + 119, cFormulaY, "+", "count-label c-formula c-formula-op"),
    addText(baseLayer, cFormulaX + 154, cFormulaY, "1", "count-label c-formula c-formula-main"),
    addText(baseLayer, cFormulaX + 193, cFormulaY, "=", "count-label c-formula c-formula-eq"),
    addText(baseLayer, cFormulaX + 226, cFormulaY, String(c), "count-label c-formula c-formula-value"),
  ];

  const cWordX = wordXs[c - 1] ?? wordXs[0] ?? 680;
  const cWordY = wordY + 34;
  const cBrace = svgEl("rect", {
    class: "c-position-mark",
    x: cWordX - wordSpacing * 0.28,
    y: wordY - 25,
    width: wordSpacing * 0.56,
    height: 44,
    rx: 12,
  });
  baseLayer.appendChild(cBrace);

  const rowLayer = svgEl("g", { class: "row-layer" });
  chainLayer.appendChild(rowLayer);

  const rowGap = Math.max(46, Math.min(60, 440 / Math.max(rows.length, 1)));
  const rowY0 = 402;
  const rowSideX = 254;
  const intervalX = 1038;
  const colorX = 1100;
  const rowCellHeight = Math.max(30, Math.min(42, rowGap - 12));

  const finalSpine = svgEl("g", { class: "chain-final-spine" });
  const spineX = rowSideX - 34;
  const spineY0 = rowY0 - rowGap * 0.14;
  const spineY1 = rowY0 + Math.max(rows.length - 1, 0) * rowGap + rowGap * 0.14;
  const finalSpineMain = svgEl("line", {
    x1: spineX,
    y1: spineY0,
    x2: spineX,
    y2: spineY0,
  });
  finalSpine.appendChild(finalSpineMain);
  const finalSpineTicks = [];
  rows.forEach((_, idx) => {
    const y = rowY0 + idx * rowGap;
    const tick = svgEl("line", {
      x1: spineX,
      y1: y,
      x2: rowSideX - 15,
      y2: y,
    });
    finalSpineTicks.push(tick);
    finalSpine.appendChild(tick);
  });
  chainLayer.appendChild(finalSpine);
  const chainSideC = makeToken(chainLayer, "c", rowSideX, rowY0, "c-marker");
  const chainSideLR = lr.map((entry, idx) => makeToken(
    chainLayer,
    entry,
    rowSideX,
    rowY0 + (idx + 1) * rowGap,
    `lr-token ${sideClass(entry)}`,
  ));

  const step2CenterY = 474;
  const sdeltaLiftY = -178;
  const step2DeltaSpacing = Math.max(42, Math.min(58, 360 / Math.max(rxw.length - 1, 1)));
  const step2DeltaXs = rowPositions(rxw.length, 690, step2DeltaSpacing);
  const step2Label = makeStep2Label(step2Layer, step2DeltaXs[0] - 150, step2CenterY + 7);
  const step2RTags = rxw.map((_, idx) => makeToken(
    step2Layer,
    "R+",
    step2DeltaXs[idx] + 15,
    step2CenterY + 25,
    "sdelta-r-tag",
  ));

  const rowRefs = rows.map((row, rowIdx) => {
    const y = rowY0 + rowIdx * rowGap;
    const group = svgEl("g", { class: "chain-row" });
    const envelopeLayer = svgEl("g", { class: "envelope-layer" });
    const boxLayer = svgEl("g", { class: "ibox-layer" });
    const dataLayer = svgEl("g", { class: "row-data-layer" });

    const rowLetters = [];
    const envelopeLeft = wordXs[row.envelope[0] - 1] - wordSpacing * 0.28;
    const envelopeRight = wordXs[row.envelope[1] - 1] + wordSpacing * 0.28;
    const envelopeY = y + rowCellHeight * 0.54;
    const envelopeRule = svgEl("line", {
      class: "chain-envelope-rule",
      x1: envelopeLeft,
      y1: envelopeY,
      x2: envelopeRight,
      y2: envelopeY,
      pathLength: 1,
    });
    envelopeLayer.appendChild(envelopeRule);
    for (let pos = row.envelope[0]; pos <= row.envelope[1]; pos += 1) {
      rowLetters.push({
        pos,
        token: makeToken(envelopeLayer, u[pos - 1], wordXs[pos - 1], wordY, "row-letter"),
      });
    }

    const boxLeft = wordXs[row.box[0] - 1] - wordSpacing * 0.32;
    const boxRight = wordXs[row.box[1] - 1] + wordSpacing * 0.32;
    const boxY = y - rowCellHeight / 2 - 2;
    const endpointX = wordXs[row.effectiveEnd - 1];
    const matchPos = row.side === "L" ? row.box[1] : row.box[0];
    const matchX = wordXs[matchPos - 1];
    const scanY = y - rowCellHeight / 2 - 15;

    const scanLine = svgEl("line", {
      class: "ibox-scan-line",
      x1: endpointX,
      y1: scanY,
      x2: endpointX,
      y2: scanY,
    });
    const dropGuide = svgEl("line", {
      class: "row-drop-guide",
      x1: endpointX,
      y1: wordY + 29,
      x2: endpointX,
      y2: wordY + 29,
    });
    const endpointHalo = svgEl("circle", {
      class: "ibox-letter-halo endpoint",
      cx: endpointX,
      cy: y,
      r: rowCellHeight * 0.46,
    });
    const matchHalo = svgEl("circle", {
      class: "ibox-letter-halo match",
      cx: matchX,
      cy: y,
      r: rowCellHeight * 0.46,
    });
    const boxFill = svgEl("rect", {
      class: "ibox-range-fill",
      x: endpointX,
      y: boxY,
      width: 0.1,
      height: rowCellHeight + 4,
      rx: 11,
    });
    const boxOutline = svgEl("rect", {
      class: "ibox-range-outline",
      x: boxLeft,
      y: boxY,
      width: boxRight - boxLeft,
      height: rowCellHeight + 4,
      rx: 11,
    });
    boxLayer.append(dropGuide, endpointHalo, matchHalo, scanLine, boxFill, boxOutline);

    const interval = addText(dataLayer, intervalX, y + 5, intervalText(row.box), "row-interval");
    const colorDot = svgEl("circle", { class: colorClass(row.color), cx: colorX, cy: y, r: 15 });
    const colorText = svgEl("text", { class: "row-color", x: colorX, y: y + 1 }, String(row.color));
    dataLayer.append(colorDot, colorText);

    group.append(boxLayer, envelopeLayer, dataLayer);
    rowLayer.appendChild(group);

    return {
      row,
      rowIdx,
      y,
      group,
      envelopeRule,
      rowLetters,
      dropGuide,
      endpointHalo,
      matchHalo,
      scanLine,
      endpointX,
      matchX,
      isDegenerateBox: Math.abs(endpointX - matchX) < 0.5,
      scanY,
      boxFill,
      boxOutline,
      boxLeft,
      boxRight,
      boxY,
      boxHeight: rowCellHeight + 4,
      interval,
      colorDot,
      colorText,
    };
  });

  const appendStartX = step2DeltaXs[step2DeltaXs.length - 1] + step2DeltaSpacing * 1.42;
  const appendSpacing = Math.max(
    34,
    Math.min(step2DeltaSpacing, (1230 - appendStartX) / Math.max(chainEntries.length - 1, 1)),
  );
  const appendRefs = chainEntries.map((entry, idx) => {
    const x = appendStartX + idx * appendSpacing;
    const changesByStar = entry.side === "L" && entry.color !== entry.h;
    const guidePath = svgEl("path", {
      class: `append-guide-path ${sideClass(entry.side)}`,
      pathLength: 1,
    });
    step2Layer.appendChild(guidePath);
    return {
      entry,
      rowRef: rowRefs[idx],
      sideSourceToken: idx === 0 ? null : chainSideLR[idx - 1],
      x,
      guidePath,
      token: makeToken(step2Layer, entry.h, x, step2CenterY, "symbol-token sdelta-chain-token"),
      rawToken: changesByStar
        ? makeToken(step2Layer, entry.color, x, step2CenterY, "symbol-token sdelta-chain-token")
        : null,
      carrier: makeColorCarrier(step2Layer, entry.h, entry.h, x, step2CenterY),
      rawCarrier: changesByStar
        ? makeColorCarrier(step2Layer, entry.color, entry.color, x, step2CenterY)
        : null,
      sideToken: makeToken(step2Layer, entry.side, x + 15, step2CenterY + 25, `sdelta-side-tag ${sideClass(entry.side)}`),
      starToken: entry.side === "L"
        ? makeToken(step2Layer, "*", x + 14, step2CenterY - 15, "sdelta-star-tag")
        : null,
    };
  });

  const iDeltaBaseY = 552;
  const totalLeftEntries = chainEntries.filter((entry) => entry.side === "L").length;
  const totalRightEntries = chainEntries.length - totalLeftEntries;
  const iDeltaLength = rxw.length + chainEntries.length;
  const iDeltaSpacing = Math.max(40, Math.min(58, 620 / Math.max(iDeltaLength - 1, 1)));
  const iDeltaCenterX = 720 + ((totalLeftEntries - totalRightEntries) * iDeltaSpacing) / 2;
  const iDeltaXs = rowPositions(rxw.length, iDeltaCenterX, iDeltaSpacing);
  const iDeltaTokens = rxw.map((entry, idx) => makeToken(
    iDeltaLayer,
    entry,
    step2DeltaXs[idx],
    step2CenterY + sdeltaLiftY,
    "symbol-token idelta-delta-token",
  ));
  const iDeltaBracket = svgEl("g", { class: "idelta-bracket" });
  const bracketLeft = iDeltaXs[0] - iDeltaSpacing * 0.36;
  const bracketRight = iDeltaXs[iDeltaXs.length - 1] + iDeltaSpacing * 0.36;
  const bracketY = iDeltaBaseY + 42;
  iDeltaBracket.appendChild(svgEl("path", {
    d: `M ${bracketLeft.toFixed(2)} ${bracketY.toFixed(2)} L ${bracketLeft.toFixed(2)} ${(bracketY + 9).toFixed(2)} L ${bracketRight.toFixed(2)} ${(bracketY + 9).toFixed(2)} L ${bracketRight.toFixed(2)} ${bracketY.toFixed(2)}`,
  }));
  appendUnderlinedDelta(iDeltaBracket, (bracketLeft + bracketRight) / 2, bracketY + 31, {
    className: "idelta-bracket-delta",
    lineClass: "idelta-bracket-delta-rule",
    scale: 0.92,
  });
  iDeltaLayer.appendChild(iDeltaBracket);
  let leftCount = 0;
  let rightCount = 0;
  const iDeltaEntryRefs = appendRefs.map((appendRef, sourceIndex) => {
    const side = appendRef.entry.side;
    if (side === "L") leftCount += 1;
    else rightCount += 1;
    const targetX = side === "L"
      ? iDeltaXs[0] - iDeltaSpacing * leftCount
      : iDeltaXs[iDeltaXs.length - 1] + iDeltaSpacing * rightCount;
    const source = { x: appendRef.x, y: step2CenterY + sdeltaLiftY };
    const guideSource = { x: appendRef.x, y: step2CenterY + sdeltaLiftY + 34 };
    const target = { x: targetX, y: iDeltaBaseY };
    const guideTarget = { x: targetX, y: iDeltaBaseY - 28 };
    const guidePath = svgEl("path", {
      class: `idelta-guide-path ${sideClass(side)}`,
      d: routeThroughUpperLanePath(guideSource, guideTarget),
      pathLength: 1,
    });
    const targetMarker = svgEl("circle", {
      class: `idelta-target-marker ${sideClass(side)}`,
      cx: targetX,
      cy: iDeltaBaseY,
      r: 18,
    });
    iDeltaLayer.appendChild(guidePath);
    iDeltaLayer.appendChild(targetMarker);
    return {
      sourceIndex,
      appendRef,
      token: makeToken(
        iDeltaLayer,
        appendRef.entry.h,
        appendRef.x,
        step2CenterY + sdeltaLiftY,
        "symbol-token idelta-entry-token",
      ),
      guidePath,
      targetMarker,
      target,
    };
  });
  const iDeltaWordLeft = Math.min(
    ...iDeltaXs,
    ...iDeltaEntryRefs.map((ref) => ref.target.x),
  );
  const iDeltaLabel = makeIDeltaLabel(iDeltaLayer, iDeltaWordLeft - 122, iDeltaBaseY + 7);
  const step3LiftY = -340;
  const step3SDeltaParkY = -265;
  iDeltaTokens.forEach((token, idx) => {
    token.group.style.setProperty("--strand-color", generatorColorValue(rxw[idx]));
    token.group.querySelector("text")?.style.setProperty("fill", generatorColorValue(rxw[idx]));
  });
  iDeltaEntryRefs.forEach((ref) => {
    ref.token.group.style.setProperty("--strand-color", generatorColorValue(ref.appendRef.entry.h));
    ref.token.group.querySelector("text")?.style.setProperty("fill", generatorColorValue(ref.appendRef.entry.h));
  });
  const iDeltaWordRefs = [
    ...iDeltaEntryRefs
      .filter((ref) => ref.appendRef.entry.side === "L")
      .slice()
      .reverse()
      .map((ref) => ({
        key: `chain:${ref.sourceIndex}`,
        token: ref.token,
        target: ref.target,
        value: ref.appendRef.entry.h,
        sourceIndex: ref.sourceIndex,
        appendRef: ref.appendRef,
      })),
    ...iDeltaTokens.map((token, idx) => ({
      key: `rxw:${idx}`,
      token,
      target: { x: iDeltaXs[idx], y: iDeltaBaseY },
      value: rxw[idx],
      sourceIndex: null,
      appendRef: null,
    })),
    ...iDeltaEntryRefs
      .filter((ref) => ref.appendRef.entry.side === "R")
      .map((ref) => ({
        key: `chain:${ref.sourceIndex}`,
        token: ref.token,
        target: ref.target,
        value: ref.appendRef.entry.h,
        sourceIndex: ref.sourceIndex,
        appendRef: ref.appendRef,
      })),
  ];
  const sourceRingTokens = new Set();
  iDeltaWordRefs.forEach((ref) => {
    if (sourceRingTokens.has(ref.token.group)) return;
    sourceRingTokens.add(ref.token.group);
    addSourceFocusRing(ref.token);
  });
  const iDeltaSourceLabels = iDeltaWordRefs
    .filter((ref) => ref.sourceIndex !== null)
    .map((ref) => makeSourceLabel(
      iDeltaLayer,
      ref.sourceIndex,
      ref.target.x,
      iDeltaBaseY - 34,
    ));

  const step4BoundaryY = 188;
  const step4BottomFinalXScale = 1;
  const step4BottomFinalYScale = 0.88;
  const step4BottomFinalTy = 138;
  const step4BottomFinalTx = 720 * (1 - step4BottomFinalXScale);
  const step4BoundarySpacing = iDeltaSpacing * step4BottomFinalXScale;
  const step4SourceXs = rowPositions(rxw.length + u.length, 720, iDeltaSpacing)
    .map((x) => x * step4BottomFinalXScale + step4BottomFinalTx);
  const step4DeltaStartX = step4SourceXs[0] ?? 720;
  const step4BoundaryGroup = svgEl("g", { class: "step4-boundary" });
  step4Layer.appendChild(step4BoundaryGroup);
  makeCompactUnderlinedDeltaIEquals(step4BoundaryGroup, step4DeltaStartX - 92, step4BoundaryY + 7);
  const step4DeltaTokens = rxw.map((entry, idx) => makeToken(
    step4BoundaryGroup,
    entry,
    step4SourceXs[idx] ?? step4DeltaStartX + idx * step4BoundarySpacing,
    step4BoundaryY,
    "symbol-token step4-boundary-token",
  ));
  const step4ITokens = u.map((entry, idx) => makeToken(
    step4BoundaryGroup,
    entry,
    step4SourceXs[rxw.length + idx] ?? step4IStartX + idx * step4BoundarySpacing,
    step4BoundaryY,
    "symbol-token step4-boundary-token",
  ));
  step4DeltaTokens.forEach((token, idx) => {
    token.group.querySelector("text")?.style.setProperty("fill", generatorColorValue(rxw[idx]));
  });
  step4ITokens.forEach((token, idx) => {
    token.group.querySelector("text")?.style.setProperty("fill", generatorColorValue(u[idx]));
  });
  makeStep4BoundaryRangeBracket(
    step4BoundaryGroup,
    step4SourceXs[0] ?? step4DeltaStartX,
    step4SourceXs[rxw.length - 1] ?? step4DeltaStartX,
    step4BoundaryY - 39,
    "Δ",
    "delta",
  );
  makeStep4BoundaryRangeBracket(
    step4BoundaryGroup,
    step4SourceXs[rxw.length] ?? step4DeltaStartX,
    step4SourceXs[rxw.length + u.length - 1] ?? step4DeltaStartX,
    step4BoundaryY - 39,
    "𝐢",
    "i",
  );
  const step4BottomSourceY = iDeltaBaseY + step3LiftY + 42;
  const step4TopY = 212;
  const step4TopSeparatedY = -76;
  const step4TopBottomY = step4BottomSourceY * step4BottomFinalYScale + step4BottomFinalTy;
  const step3BottomRawY = iDeltaBaseY + step3LiftY + 92
    + Math.max(30, Math.min(58, 505 / Math.max(step3ExactStripItems.length, 1))) * step3ExactStripItems.length;
  const step4BottomFinalBottomY = step3BottomRawY * step4BottomFinalYScale + step4BottomFinalTy;
  const step4TopClipId = `step4-top-reveal-${Math.random().toString(36).slice(2)}`;
  const step4TopClip = svgEl("clipPath", {
    id: step4TopClipId,
    clipPathUnits: "userSpaceOnUse",
  });
  const step4TopClipRect = svgEl("rect", {
    x: 0,
    y: step4TopY - 14,
    width: 1440,
    height: 0,
  });
  step4TopClip.appendChild(step4TopClipRect);
  defs.appendChild(step4TopClip);
  const step4TopWeaveGroup = svgEl("g", {
    class: "step4-top-weave",
    "clip-path": `url(#${step4TopClipId})`,
  });
  step4Layer.insertBefore(step4TopWeaveGroup, step4BoundaryGroup);
  const step4TopModel = drawStep4TopWeave(step4TopWeaveGroup);
  const step4TopBracket = makeStep4VerticalBracket(step4Layer, 402, step4TopY + 8, step4TopBottomY - 8);
  const step4BottomBracket = makeStep4VerticalBracket(step4Layer, 402, step4TopBottomY + 8, step4BottomFinalBottomY - 8);
  const step4BottomLabel = makeStep4TextLabel(step4Layer, 342, (step4TopBottomY + step4BottomFinalBottomY) / 2 + 8, [
    "i",
    { text: "Δ", attrs: { dy: "5", "font-size": "13", "font-weight": "760" } },
    { text: "(C) → w", attrs: { dy: "-5" } },
    { text: "0", attrs: { dy: "5", "font-size": "13", "font-weight": "760" } },
  ]);
  const step4TopLabel = makeStep4TextLabel(step4Layer, 342, (step4TopY + step4TopBottomY) / 2 + 8, [
    "Δi → i",
    { text: "Δ", attrs: { dy: "5", "font-size": "13", "font-weight": "760" } },
    { text: "(C)", attrs: { dy: "-5" } },
  ]);
  const step4FinalLabelY = 812;
  const step4FinalLabel = makeStep4WeaveLabel(step4Layer, 720, step4FinalLabelY, "");
  setOpacity(step4Layer, 0);

  function makeCompactUnderlinedDeltaIEquals(parent, x, y) {
    const group = svgEl("g", { class: "step4-boundary-label step4-delta-i-equals" });
    appendUnderlinedDelta(group, x, y, {
      className: "underlined-delta-symbol",
      lineClass: "underlined-delta-rule",
      scale: 1.18,
    });
    group.appendChild(svgEl("text", {
      class: "underlined-delta-i-symbol",
      x: x + 31,
      y,
      "text-anchor": "middle",
    }, "𝐢"));
    group.appendChild(svgEl("text", {
      class: "underlined-delta-equals",
      x: x + 55,
      y,
      "text-anchor": "middle",
    }, "="));
    parent.appendChild(group);
    return group;
  }

  function makeStep4BoundaryRangeBracket(parent, leftX, rightX, y, label, kind) {
    const pad = step4BoundarySpacing * 0.36;
    const left = leftX - pad;
    const right = rightX + pad;
    const group = svgEl("g", { class: `step4-boundary-range step4-boundary-range-${kind}` });
    group.appendChild(svgEl("path", {
      d: [
        `M ${left.toFixed(2)} ${(y + 8).toFixed(2)}`,
        `L ${left.toFixed(2)} ${y.toFixed(2)}`,
        `L ${right.toFixed(2)} ${y.toFixed(2)}`,
        `L ${right.toFixed(2)} ${(y + 8).toFixed(2)}`,
      ].join(" "),
    }));
    if (label === "Δ") {
      appendUnderlinedDelta(group, (left + right) / 2, y - 15, {
        className: "step4-boundary-range-label step4-boundary-range-delta-label",
        lineClass: "step4-boundary-range-delta-rule",
        scale: 0.86,
      });
    } else {
      group.appendChild(svgEl("text", {
        class: "step4-boundary-range-label",
        x: (left + right) / 2,
        y: y - 14,
        "text-anchor": "middle",
      }, label));
    }
    parent.appendChild(group);
    return group;
  }

  function makeStep4VerticalBracket(parent, x, y1, y2) {
    const group = svgEl("g", { class: "step4-weave-bracket" });
    group.appendChild(svgEl("path", {
      d: [
        `M ${x.toFixed(2)} ${y1.toFixed(2)}`,
        `L ${(x + 12).toFixed(2)} ${y1.toFixed(2)}`,
        `M ${x.toFixed(2)} ${y1.toFixed(2)}`,
        `L ${x.toFixed(2)} ${y2.toFixed(2)}`,
        `M ${x.toFixed(2)} ${y2.toFixed(2)}`,
        `L ${(x + 12).toFixed(2)} ${y2.toFixed(2)}`,
      ].join(" "),
    }));
    parent.appendChild(group);
    return group;
  }

  function makeStep4WeaveLabel(parent, x, y, supText = "") {
    const group = svgEl("g", { class: "step4-weave-label" });
    group.appendChild(svgEl("text", { class: "step4-weave-symbol", x: -42, y: 0 }, "W"));
    if (supText) group.appendChild(svgEl("text", { class: "step4-weave-sup", x: -13, y: -16 }, supText));
    group.appendChild(svgEl("text", { class: "step4-weave-sub", x: -8, y: 17 }, "Δ"));
    group.appendChild(svgEl("line", {
      class: "step4-weave-sub-rule",
      x1: -16,
      y1: 22,
      x2: 0,
      y2: 22,
    }));
    group.appendChild(svgEl("text", { class: "step4-weave-arg", x: 18, y: 0 }, "(C)"));
    setTransform(group, x, y, 1);
    parent.appendChild(group);
    return group;
  }

  function makeStep4TextLabel(parent, x, y, parts) {
    const group = svgEl("g", { class: "step4-text-label" });
    const text = svgEl("text", { x: 0, y: 0 });
    const labelParts = Array.isArray(parts) ? parts : [parts];
    labelParts.forEach((part) => {
      if (typeof part === "string") {
        text.appendChild(svgEl("tspan", {}, part));
        return;
      }
      text.appendChild(svgEl("tspan", part.attrs ?? {}, part.text ?? ""));
    });
    group.appendChild(text);
    setTransform(group, x, y, 1);
    parent.appendChild(group);
    return group;
  }

  function appendStep4TopPath(parent, d, color, extraClass = "") {
    const path = svgEl("path", {
      class: `step4-top-strand ${extraClass}`.trim(),
      d,
      stroke: color,
    });
    parent.appendChild(path);
    return path;
  }

  function drawStep4TopStrip(parent, strip) {
    const { before: beforeRow, after: afterRow, move } = strip;
    const before = beforeRow.word;
    const after = afterRow.word;
    const topY = beforeRow.y;
    const botY = afterRow.y;
    const p = move.pos;
    const topX = beforeRow.xs;
    const botX = afterRow.xs;
    const group = svgEl("g", { class: `step4-top-strip step4-top-strip-${move.type}` });
    const drawDirect = (topIdx, botIdx, colorIdx = topIdx, extraClass = "passive") => {
      if (topX[topIdx] === undefined || botX[botIdx] === undefined) return;
      appendStep4TopPath(
        group,
        step3StripPathD(topX[topIdx], topY, botX[botIdx], botY),
        generatorColorValue(before[colorIdx]),
        extraClass,
      );
    };

    if (move.type === "tetra") {
      for (let local = 0; local < p; local += 1) drawDirect(local, local);
      drawDirect(p, p + 1, p, "active");
      drawDirect(p + 1, p, p + 1, "active");
      for (let local = p + 2; local < before.length; local += 1) drawDirect(local, local);
    } else if (move.type === "hexa") {
      for (let local = 0; local < p; local += 1) drawDirect(local, local);
      const vertexX = (topX[p] + topX[p + 1] + topX[p + 2]) / 3;
      const vertexY = (topY + botY) / 2;
      for (let offset = 0; offset < 3; offset += 1) {
        const topIdx = p + offset;
        const botIdx = p + offset;
        appendStep4TopPath(
          group,
          step3StripPathD(topX[topIdx], topY, vertexX, vertexY),
          generatorColorValue(before[topIdx]),
          "active",
        );
        appendStep4TopPath(
          group,
          step3StripPathD(vertexX, vertexY, botX[botIdx], botY),
          generatorColorValue(after[botIdx]),
          "active",
        );
      }
      group.appendChild(svgEl("circle", {
        class: "step4-top-dot",
        cx: vertexX,
        cy: vertexY,
        r: 3.6,
      }));
      for (let local = p + 3; local < before.length; local += 1) drawDirect(local, local);
    } else {
      for (let local = 0; local < Math.min(before.length, after.length); local += 1) {
        drawDirect(local, local);
      }
    }
    parent.appendChild(group);
    return group;
  }

  function makeStep4DebugAnchors({ layout, bottomSourceWord, check }) {
    if (!debugAnchors) return null;
    const group = svgEl("g", { class: "step4-debug-anchors" });
    const targetRow = layout.rows[layout.rows.length - 1] ?? null;
    if (!targetRow) return null;
    const bottomXs = rowPositions(bottomSourceWord.length, 720, iDeltaSpacing)
      .map((x) => x * step4BottomFinalXScale + step4BottomFinalTx);
    const bottomY = step4BottomSourceY * step4BottomFinalYScale + step4BottomFinalTy;
    const maxDelta = targetRow.xs.reduce((maxValue, x, idx) => {
      const dx = Math.abs(x - (bottomXs[idx] ?? x));
      const dy = Math.abs(targetRow.y - bottomY);
      return Math.max(maxValue, dx, dy);
    }, 0);
    targetRow.xs.forEach((x, idx) => {
      group.appendChild(svgEl("circle", {
        class: "step4-debug-target-anchor",
        cx: x,
        cy: targetRow.y,
        r: 5,
      }));
      group.appendChild(svgEl("text", {
        class: "step4-debug-index",
        x,
        y: targetRow.y - 10,
      }, String(idx + 1)));
    });
    bottomXs.forEach((x) => {
      group.appendChild(svgEl("line", {
        class: "step4-debug-bottom-anchor",
        x1: x - 7,
        y1: bottomY,
        x2: x + 7,
        y2: bottomY,
      }));
      group.appendChild(svgEl("line", {
        class: "step4-debug-bottom-anchor",
        x1: x,
        y1: bottomY - 7,
        x2: x,
        y2: bottomY + 7,
      }));
    });
    const status = check.ok ? `max gap ${maxDelta.toFixed(2)} px` : "word mismatch";
    group.appendChild(svgEl("text", {
      class: check.ok ? "step4-debug-status" : "step4-debug-status is-error",
      x: 1025,
      y: targetRow.y + 8,
    }, status));
    step4Layer.appendChild(group);
    return group;
  }

  function drawStep4TopWeave(parent) {
    const topWeave = nextTrace.topWeave;
    const moves = topWeave?.moves ?? [];
    const words = topWeave?.words ?? [];
    const slotXs = step4SourceXs.slice();
    const targetWord = words[words.length - 1] ?? [];
    const targetXs = rowPositions(targetWord.length, 720, iDeltaSpacing)
      .map((x) => x * step4BottomFinalXScale + step4BottomFinalTx);
    const bottomSourceWord = step3ExactStripItems[0]?.before ?? [];
    const check = topWeaveTargetCheck(topWeave, bottomSourceWord);
    if (!check.ok) {
      console.warn("Top weave target word does not match the bottom weave source word.", check);
    }
    const layout = buildTopWeaveLayout({
      topWeave,
      sourceXs: slotXs,
      targetXs,
      topY: step4TopY,
      targetY: step4TopBottomY,
    });
    if (moves.length === 0 && words[0]) {
      const directGroup = svgEl("g", { class: "step4-top-strip" });
      const topXs = layout.rows[0]?.xs ?? slotXs;
      const bottomXs = targetXs;
      words[0].forEach((entry, idx) => {
        appendStep4TopPath(
          directGroup,
          step3StripPathD(topXs[idx] ?? bottomXs[idx], step4TopY, bottomXs[idx], step4TopBottomY),
          generatorColorValue(entry),
        );
      });
      parent.appendChild(directGroup);
      const debugGroup = makeStep4DebugAnchors({ layout, bottomSourceWord, check });
      return { strips: [directGroup], layout, check, debugGroup };
    }
    const strips = layout.strips.map((strip) => drawStep4TopStrip(parent, strip));
    const debugGroup = makeStep4DebugAnchors({ layout, bottomSourceWord, check });
    return { strips, layout, check, debugGroup };
  }

  function makeStep3VertexBadge(parent, x, y, label) {
    const text = clusterIndexText(label, label);
    const width = Math.max(20, 12 + text.length * 8);
    const group = svgEl("g", { class: "step3-vertex-badge" });
    group.appendChild(svgEl("rect", {
      x: x - width / 2,
      y: y - 10,
      width,
      height: 20,
      rx: 10,
    }));
    group.appendChild(svgEl("text", { x, y: y + 4 }, text));
    parent.appendChild(group);
    return group;
  }

  function step3StripPathD(x1, y1, x2, y2) {
    const midY = (y1 + y2) / 2;
    return `M ${x1.toFixed(2)} ${y1.toFixed(2)} C ${x1.toFixed(2)} ${midY.toFixed(2)} ${x2.toFixed(2)} ${midY.toFixed(2)} ${x2.toFixed(2)} ${y2.toFixed(2)}`;
  }

  function appendStep3StripPath(parent, d, color, extraClass = "") {
    const path = svgEl("path", {
      class: `step3-strip-strand ${extraClass}`.trim(),
      d,
      stroke: color,
      pathLength: 1,
    });
    parent.appendChild(path);
    return path;
  }

  function drawStep3Strip(item, localIdx) {
    const maxRowLength = Math.max(item.before.length, item.after.length, 1);
    const rowHeight = Math.max(30, Math.min(58, 505 / Math.max(step3ExactStripItems.length, 1)));
    const topY = iDeltaBaseY + step3LiftY + 92 + localIdx * rowHeight;
    const botY = topY + rowHeight;
    const spacing = iDeltaSpacing;
    const p = item.move.pos;
    const sourceIndex = item.move.sourceStep ? item.move.sourceStep - rxw.length - 1 : null;
    const sourceTopIdx = item.move.sourceTopIdx ?? null;
    const sourceBotIdx = item.move.sourceBotIdx ?? null;
    const center = 720;
    const topX = rowPositions(item.before.length, center, spacing);
    const botX = rowPositions(item.after.length, center, spacing);
    const group = svgEl("g", { class: `step3-strip step3-strip-${item.move.type}` });
    const paths = [];
    const dots = [];
    const drawDirect = (topIdx, botIdx, colorIdx = topIdx, extraClass = "passive-move") => {
      if (topX[topIdx] === undefined || botX[botIdx] === undefined) return null;
      const sourceClass = topIdx === sourceTopIdx && botIdx === sourceBotIdx
        ? " source-carry"
        : "";
      const path = appendStep3StripPath(
        group,
        step3StripPathD(topX[topIdx], topY, botX[botIdx], botY),
        generatorColorValue(item.before[colorIdx]),
        `${extraClass}${sourceClass}`,
      );
      paths.push(path);
      return path;
    };

    if (item.move.type === "tetra") {
      for (let idx = 0; idx < p; idx += 1) drawDirect(idx, idx);
      drawDirect(p, p + 1, p, "active-move");
      drawDirect(p + 1, p, p + 1, "active-move");
      for (let idx = p + 2; idx < item.before.length; idx += 1) drawDirect(idx, idx);
    } else if (item.move.type === "hexa") {
      for (let idx = 0; idx < p; idx += 1) drawDirect(idx, idx);
      const vertexX = (topX[p] + topX[p + 1] + topX[p + 2]) / 3;
      const vertexY = (topY + botY) / 2;
      for (let offset = 0; offset < 3; offset += 1) {
        const topIdx = p + offset;
        const botIdx = p + offset;
        paths.push(appendStep3StripPath(
          group,
          step3StripPathD(topX[topIdx], topY, vertexX, vertexY),
          generatorColorValue(item.before[topIdx]),
          `active-move${topIdx === sourceTopIdx ? " source-carry" : ""}`,
        ));
        paths.push(appendStep3StripPath(
          group,
          step3StripPathD(vertexX, vertexY, botX[botIdx], botY),
          generatorColorValue(item.after[botIdx]),
          `active-move${botIdx === sourceBotIdx ? " source-carry" : ""}`,
        ));
      }
      dots.push(svgEl("circle", {
        class: "step3-strip-move-dot",
        cx: vertexX,
        cy: vertexY,
        r: 4,
      }));
      for (let idx = p + 3; idx < item.before.length; idx += 1) drawDirect(idx, idx);
    } else if (item.move.type === "tri") {
      const triInputPaths = [];
      const triOutputPaths = [];
      for (let idx = 0; idx < p; idx += 1) drawDirect(idx, idx);
      const vertexX = (topX[p] + topX[p + 1] + botX[p]) / 3;
      const vertexY = (topY + botY) / 2;
      const leftInput = appendStep3StripPath(
        group,
        step3StripPathD(topX[p], topY, vertexX, vertexY),
        generatorColorValue(item.before[p]),
        `active-move tri-input${sourceTopIdx === p ? " source-carry" : " target-descent"}`,
      );
      const rightInput = appendStep3StripPath(
        group,
        step3StripPathD(topX[p + 1], topY, vertexX, vertexY),
        generatorColorValue(item.before[p + 1]),
        `active-move tri-input${sourceTopIdx === p + 1 ? " source-carry" : " target-descent"}`,
      );
      const outputPath = appendStep3StripPath(
        group,
        step3StripPathD(vertexX, vertexY, botX[p], botY),
        generatorColorValue(item.after[p]),
        "active-move tri-output",
      );
      paths.push(leftInput, rightInput, outputPath);
      triInputPaths.push(leftInput, rightInput);
      triOutputPaths.push(outputPath);
      const dot = svgEl("circle", {
        class: "step3-strip-tri-dot",
        cx: vertexX,
        cy: vertexY,
        r: 5,
      });
      dots.push(dot);
      for (let idx = p + 2; idx < item.before.length; idx += 1) drawDirect(idx, idx - 1);
      const badge = item.triInfo
        ? makeStep3VertexBadge(group, vertexX + 15, vertexY - 13, item.triInfo.clusterVariable)
        : null;
      group.append(...dots);
      step3Layer.appendChild(group);
      setOpacity(group, 0);
      paths.forEach((path) => setDashProgress(path, 0));
      dots.forEach((dotNode) => setOpacity(dotNode, 0));
      if (badge) setOpacity(badge, 0);
      return {
        group,
        paths,
        triInputPaths,
        triOutputPaths,
        dots,
        badge,
        triVertex: { x: vertexX, y: vertexY },
        item,
        sourceIndex,
        topY,
        botY,
      };
    } else {
      for (let idx = 0; idx < Math.min(item.before.length, item.after.length); idx += 1) drawDirect(idx, idx);
    }

    group.append(...dots);
    step3Layer.appendChild(group);
    setOpacity(group, 0);
    paths.forEach((path) => setDashProgress(path, 0));
    dots.forEach((dot) => setOpacity(dot, 0));
    return {
      group,
      paths,
      dots,
      badge: null,
      triVertex: null,
      item,
      sourceIndex,
      topY,
      botY,
    };
  }

  function mergeInputPathD(from, vertex, side) {
    const bend = side === "left" ? -24 : 24;
    return [
      `M ${from.x.toFixed(2)} ${from.y.toFixed(2)}`,
      `C ${from.x.toFixed(2)} ${(from.y + 48).toFixed(2)}`,
      `${(vertex.x + bend).toFixed(2)} ${(vertex.y - 34).toFixed(2)}`,
      `${vertex.x.toFixed(2)} ${vertex.y.toFixed(2)}`,
    ].join(" ");
  }

  function mergeOutputPathD(vertex, to) {
    return [
      `M ${vertex.x.toFixed(2)} ${vertex.y.toFixed(2)}`,
      `C ${vertex.x.toFixed(2)} ${(vertex.y + 30).toFixed(2)}`,
      `${to.x.toFixed(2)} ${(to.y - 42).toFixed(2)}`,
      `${to.x.toFixed(2)} ${to.y.toFixed(2)}`,
    ].join(" ");
  }

  function backgroundStrandPathD(x, topY, bottomY) {
    return [
      `M ${x.toFixed(2)} ${topY.toFixed(2)}`,
      `C ${x.toFixed(2)} ${(topY + 48).toFixed(2)}`,
      `${x.toFixed(2)} ${(bottomY - 48).toFixed(2)}`,
      `${x.toFixed(2)} ${bottomY.toFixed(2)}`,
    ].join(" ");
  }

  function drawStep3MergeScene(scene, topItems, sceneIdx) {
    if (!scene) return null;
    const activeRef = topItems.find((ref) => ref.key === scene.sourceKey);
    const partnerRef = topItems.find((ref) => ref.key === scene.partnerKey);
    const leftRef = topItems.find((ref) => ref.key === scene.leftKey);
    const rightRef = topItems.find((ref) => ref.key === scene.rightKey);
    if (!activeRef || !partnerRef || !leftRef || !rightRef) return null;
    const group = svgEl("g", { class: "step3-first-merge" });
    const clipId = `step3-merge-clip-${sceneIdx}`;
    const clipPath = svgEl("clipPath", { id: clipId });
    const clipRect = svgEl("rect", {
      x: 0,
      y: 0,
      width: 1440,
      height: 0,
    });
    clipPath.appendChild(clipRect);
    defs.appendChild(clipPath);
    const clippedGroup = svgEl("g", { "clip-path": `url(#${clipId})` });
    const color = generatorColorValue(scene.color);
    const topY = iDeltaBaseY + step3LiftY + 90 + sceneIdx * 136;
    const vertex = {
      x: (leftRef.target.x + rightRef.target.x) / 2,
      y: topY + 92,
    };
    const bottom = { x: vertex.x, y: vertex.y + 86 };
    const leftStart = { x: leftRef.target.x, y: topY };
    const rightStart = { x: rightRef.target.x, y: topY };
    const backgroundBottomY = bottom.y;
    const backgroundPaths = topItems
      .filter((ref) => ref !== activeRef)
      .map((ref) => {
        const path = svgEl("path", {
          class: `step3-background-strand${ref === partnerRef ? " partner-background" : ""}`,
          d: backgroundStrandPathD(ref.target.x, topY, backgroundBottomY),
          stroke: generatorColorValue(ref.value),
          pathLength: 1,
        });
        clippedGroup.appendChild(path);
        return path;
      });
    const activeIsLeft = activeRef === leftRef;
    const leftPath = svgEl("path", {
      class: `step3-merge-strand input ${activeIsLeft ? "active" : "partner"}`,
      d: mergeInputPathD(leftStart, vertex, "left"),
      stroke: color,
      pathLength: 1,
    });
    const rightPath = svgEl("path", {
      class: `step3-merge-strand input ${activeIsLeft ? "partner" : "active"}`,
      d: mergeInputPathD(rightStart, vertex, "right"),
      stroke: color,
      pathLength: 1,
    });
    const outputPath = svgEl("path", {
      class: "step3-merge-strand output",
      d: mergeOutputPathD(vertex, bottom),
      stroke: color,
      pathLength: 1,
    });
    const dot = svgEl("circle", {
      class: "step3-strip-tri-dot",
      cx: vertex.x,
      cy: vertex.y,
      r: 5,
    });
    const vertexHalo = svgEl("circle", {
      class: "step3-tri-hold-ring",
      cx: vertex.x,
      cy: vertex.y,
      r: 16,
    });
    clippedGroup.append(leftPath, rightPath, outputPath);
    group.append(clippedGroup, vertexHalo, dot);
    const badge = makeStep3VertexBadge(group, vertex.x + 21, vertex.y - 18, scene.clusterVariable);
    step3Layer.appendChild(group);
    setOpacity(group, 0);
    [...backgroundPaths, leftPath, rightPath, outputPath].forEach((path) => setDashProgress(path, 1));
    setOpacity(vertexHalo, 0);
    setOpacity(dot, 0);
    setOpacity(badge, 0);
    const firstPos = topItems.findIndex((ref) => ref.key === leftRef.key);
    const secondPos = topItems.findIndex((ref) => ref.key === rightRef.key);
    const survivorRef = activeRef === leftRef ? rightRef : leftRef;
    const insertPos = Math.min(firstPos, secondPos);
    const nextItems = topItems.filter((_, idx) => idx !== firstPos && idx !== secondPos);
    nextItems.splice(insertPos, 0, {
      ...survivorRef,
      target: { x: vertex.x, y: bottom.y },
      value: scene.color,
    });
    return {
      group,
      clipRect,
      topY,
      bottomY: bottom.y,
      backgroundPaths,
      partnerBackgroundPath: backgroundPaths.find((path) => path.classList.contains("partner-background")) ?? null,
      activeInputPath: activeIsLeft ? leftPath : rightPath,
      partnerInputPath: activeIsLeft ? rightPath : leftPath,
      outputPath,
      vertexHalo,
      dot,
      badge,
      triVertex: vertex,
      sourceIndex: scene.sourceIndex,
      sourceWordRef: activeRef,
      sourceAppendRef: scene.sourceIndex === null ? null : iDeltaEntryRefs[scene.sourceIndex],
      nextItems,
    };
  }

  const step3ExactStrips = step3ExactStripItems.map((item, idx) => drawStep3Strip(item, idx));
  const step3TopExtensions = (() => {
    const firstItem = step3ExactStripItems[0];
    if (!firstItem) return [];
    const topCount = firstItem.before.length;
    const topXs = rowPositions(topCount, 720, iDeltaSpacing);
    const startY = iDeltaBaseY + step3LiftY + 42;
    const endY = iDeltaBaseY + step3LiftY + 92;
    return topXs.map((x, idx) => {
      const wordRef = iDeltaWordRefs[idx] ?? null;
      const path = svgEl("path", {
        class: "step3-top-extension",
        d: backgroundStrandPathD(x, startY, endY),
        stroke: generatorColorValue(firstItem.before[idx]),
        pathLength: 1,
      });
      if (step3ExactStrips[0]?.group) step3Layer.insertBefore(path, step3ExactStrips[0].group);
      else step3Layer.appendChild(path);
      setOpacity(path, 0);
      setDashProgress(path, 0);
      return {
        path,
        sourceIndex: wordRef?.sourceIndex ?? null,
        x,
        topY: startY,
        wordRef,
      };
    });
  })();
  const step3StripClipRects = step3ExactStrips.map((strip, idx) => {
    const clipId = `step3-strip-reveal-${idx}-${Math.random().toString(36).slice(2)}`;
    const clip = svgEl("clipPath", {
      id: clipId,
      clipPathUnits: "userSpaceOnUse",
    });
    const rect = svgEl("rect", {
      x: 0,
      y: (strip.topY ?? 0) - 12,
      width: 1440,
      height: 0,
    });
    clip.appendChild(rect);
    defs.appendChild(clip);
    const clipUrl = `url(#${clipId})`;
    strip.paths.forEach((path) => path.setAttribute("clip-path", clipUrl));
    return rect;
  });
  const step3SourceOverlayGroup = svgEl("g", { class: "step3-source-overlay" });
  const step3SourceOverlayPaths = step3ExactStrips.map(() => {
    const path = svgEl("path", {
      class: "step3-source-overlay-path",
      pathLength: 1,
    });
    step3SourceOverlayGroup.appendChild(path);
    setOpacity(path, 0);
    setDashProgress(path, 1);
    return path;
  });
  step3Layer.appendChild(step3SourceOverlayGroup);

  function combinedPathD(paths) {
    return paths
      .map((path) => path.getAttribute("d") ?? "")
      .filter(Boolean)
      .join(" ");
  }

  let step3LayoutItems = iDeltaWordRefs.map((ref) => ({ ...ref, target: { ...ref.target } }));
  const step3MergeScenes = step3MergeSceneData
    .map((scene, sceneIdx) => {
      const visual = drawStep3MergeScene(scene, step3LayoutItems, sceneIdx);
      if (visual?.nextItems) step3LayoutItems = visual.nextItems;
      return visual;
    })
    .filter(Boolean);
  const step3SourceHalos = step3MergeScenes.map((scene) => {
    if (!scene.sourceWordRef) return null;
    const halo = svgEl("circle", {
      class: "step3-word-halo",
      cx: scene.sourceWordRef.target.x,
      cy: iDeltaBaseY,
      r: 23,
    });
    iDeltaLayer.appendChild(halo);
    setOpacity(halo, 0);
    return halo;
  });

  function iDeltaEntryTiming(idx) {
    const start = iDeltaDeltaEnd + idx * IDELTA_ENTRY_SPAN;
    const end = start + IDELTA_ENTRY_SPAN;
    return {
      start,
      end,
      sideFocusStart: start,
      sideFocusEnd: start + IDELTA_ENTRY_SPAN * 0.16,
      targetStart: start + IDELTA_ENTRY_SPAN * 0.24,
      targetEnd: start + IDELTA_ENTRY_SPAN * 0.38,
      guideStart: start + IDELTA_ENTRY_SPAN * 0.44,
      guideEnd: start + IDELTA_ENTRY_SPAN * 0.58,
      copyStart: start + IDELTA_ENTRY_SPAN * 0.62,
      copyEnd: start + IDELTA_ENTRY_SPAN * 0.70,
      moveStart: start + IDELTA_ENTRY_SPAN * 0.76,
      moveEnd: start + IDELTA_ENTRY_SPAN,
    };
  }

  function step3StripTiming(idx) {
    const record = step3StripTimings[idx] ?? { start: step3StripStart, span: STEP3_PREP_STRIP_SPAN, isTri: false };
    const { start, span, isTri } = record;
    const drawStart = start + span * (isTri ? 0.18 : 0.04);
    const drawEnd = start + span * (isTri ? 0.98 : 0.96);
    const inputEnd = start + span * (isTri ? 0.66 : 0.86);
    const vertexStart = start + span * (isTri ? 0.80 : 0.82);
    const vertexEnd = start + span * (isTri ? 0.87 : 0.96);
    const outputStart = start + span * (isTri ? 0.96 : 0.92);
    const outputEnd = start + span;
    const holdEnd = start + span;
    return {
      start,
      span,
      isTri,
      drawStart,
      drawEnd,
      inputEnd,
      vertexStart,
      vertexEnd,
      outputStart,
      outputEnd,
      holdEnd,
    };
  }

  function appendTiming(idx) {
    const start = MARKS.step2RInitEnd + idx * (APPEND_SPAN + APPEND_GAP);
    const end = start + APPEND_SPAN;
    return {
      start,
      end,
      progress: fade,
      focusStart: start,
      focusEnd: start + APPEND_SPAN * 0.16,
      transformStart: start + APPEND_SPAN * 0.22,
      transformEnd: start + APPEND_SPAN * 0.42,
      moveStart: start + APPEND_SPAN * 0.52,
      moveEnd: start + APPEND_SPAN * 0.80,
      sideStart: start + APPEND_SPAN * 0.86,
      sideEnd: start + APPEND_SPAN * 0.92,
      retireMoveStart: start + APPEND_SPAN * 0.92,
      retireMoveEnd: end + APPEND_GAP * 0.20,
      retireFadeStart: start + APPEND_SPAN * 0.95,
      retireFadeEnd: end + APPEND_GAP * 0.08,
    };
  }

  function rowTiming(rowIdx) {
    const total = MARKS.chainEnd - MARKS.chainStart;
    const interRowGap = rows.length > 1 ? 0.07 : 0;
    const available = Math.max(0.0001, total - interRowGap * Math.max(rows.length - 1, 0));
    const weights = rows.map(() => 1);
    const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
    const unit = available / Math.max(weightSum, 1);
    const start = MARKS.chainStart + weights
      .slice(0, rowIdx)
      .reduce((sum, weight) => sum + weight * unit, 0)
      + interRowGap * rowIdx;
    const span = weights[rowIdx] * unit;
    return { start, end: start + span * 0.92 };
  }

  function rowAmount(progress, rowIdx) {
    const { start, end } = rowTiming(rowIdx);
    return clamp((progress - start) / Math.max(0.0001, end - start));
  }

  function buildNarrationCues() {
    const cues = [
      {
        at: 0,
        text: "We construct the Demazure weave associated with an admissible chain C.",
        caption: "Construct the Demazure weave associated with C.",
      },
      {
        at: MARKS.wordEnd,
        text: "First, fix an element b of the positive braid monoid, and choose an expression sequence i of b.",
        caption: "Fix b and an expression sequence i of b.",
      },
      {
        at: MARKS.deltaEnd,
        text: "Then choose an LR sequence H. These data determine an admissible chain C of i-boxes.",
        caption: "The LR sequence determines C from i.",
      },
      {
        at: MARKS.lrEnd,
        text: "We also fix Delta, a reduced expression of the longest element in the Weyl group.",
        caption: "Fix Delta.",
      },
      {
        at: MARKS.countEnd,
        text: "The number of L entries determines the initial position c.",
        caption: "The number of L entries determines c.",
      },
      {
        at: MARKS.locateEnd,
        text: "Starting from c, we read the LR sequence from left to right.",
        caption: "Start at c and read the LR sequence.",
      },
    ];
    const initialTiming = rowTiming(0);
    cues.push({
      at: initialTiming.start + (initialTiming.end - initialTiming.start) * 0.58,
      text: "Before reading the LR sequence, start with the one-point envelope at c.",
      caption: "Begin with the one-point envelope at c.",
    });
    cues.push({
      at: initialTiming.end,
      text: "At c, the one-point interval is the first i-box, and we record its color.",
      caption: "The one-point interval gives the first i-box.",
    });

    const ordinals = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh", "eighth"];
    const detailedChainRows = Math.min(rows.length, 3);
    rows.slice(1, detailedChainRows).forEach((_, localIdx) => {
      const rowIdx = localIdx + 1;
      const timing = rowTiming(rowIdx);
      const entry = lr[localIdx];
      const side = entry === "L" ? "left" : "right";
      const ordinal = ordinals[localIdx] ?? `number ${localIdx + 1}`;
      cues.push({
        at: timing.start + (timing.end - timing.start) * 0.58,
        text: `For the ${ordinal} entry, ${entry}, add one new endpoint on the ${side} side of the envelope.`,
        caption: `${entry}: grow the envelope to the ${side}.`,
      });
      cues.push({
        at: timing.end,
        text: entry === "L"
          ? "For a left move, close at the rightmost occurrence of the new endpoint's color inside the envelope. This interval is the next i-box, and we record its color."
          : "For a right move, close at the leftmost occurrence of the new endpoint's color inside the envelope. This interval is the next i-box, and we record its color.",
        caption: entry === "L"
          ? "Close at the rightmost occurrence of the new endpoint's color."
          : "Close at the leftmost occurrence of the new endpoint's color.",
      });
    });
    if (rows.length > detailedChainRows) {
      const timing = rowTiming(detailedChainRows);
      cues.push({
        at: timing.start,
        text: "The remaining entries are treated in the same way: grow the envelope, then record the corresponding i-box.",
        caption: "Repeat: grow the envelope, then record the i-box.",
      });
    }
    cues.push(
      {
        at: MARKS.chainEnd + 0.08,
        text: "This gives the admissible chain C.",
        caption: "This gives the admissible chain C.",
      },
      {
        at: MARKS.step2Start + 0.16,
        text: "Next, we form the double string from the colors of these i-boxes.",
        caption: "Now form the double string from the i-box colors.",
      },
      {
        at: MARKS.step2DeltaEnd,
        text: "The word for Delta contributes the initial R plus entries of the double string.",
        caption: "Delta contributes the initial R plus entries.",
      },
    );
    const detailedAppendRows = Math.min(appendRefs.length, 3);
    appendRefs.slice(0, detailedAppendRows).forEach((appendRef, idx) => {
      const timing = appendTiming(idx);
      const color = appendRef.entry.color;
      const side = appendRef.entry.side;
      const output = `${appendRef.entry.h}${side}`;
      const ordinal = ordinals[idx] ?? `number ${idx + 1}`;
      if (idx === 0) {
        cues.push({
          at: timing.focusStart + APPEND_SPAN * 0.08,
          text: "Now read the rows of the admissible chain one by one.",
          caption: "Read the rows of C one by one.",
        });
      }
      cues.push({
        at: timing.focusStart + APPEND_SPAN * 0.18,
        text: `For the ${ordinal} row, start from color ${color} and side ${side}.`,
        caption: `Row ${idx + 1}: color ${color}, side ${side}.`,
      });
      if (side === "L") {
        cues.push({
          at: timing.transformStart + APPEND_SPAN * 0.12,
          text: `Since the side is L, replace the color by its star, giving ${appendRef.entry.h}.`,
          caption: `For side L, replace the color by its star.`,
        });
      }
      cues.push({
        at: timing.moveStart + APPEND_SPAN * 0.18,
        text: `Append ${output} to the double string.`,
        caption: `Append ${output} to the double string.`,
      });
    });
    if (appendRefs.length > detailedAppendRows) {
      const timing = appendTiming(detailedAppendRows);
      cues.push({
        at: timing.focusStart,
        text: "Continue by the same rule for the remaining rows.",
        caption: "Continue by the same rule.",
      });
    }
    cues.push(
      {
        at: appendEnd + 0.08,
        text: "This completes the double string.",
        caption: "This completes the double string.",
      },
      {
        at: sdeltaLiftEnd + 0.04,
        text: "To form the word i Delta of C, keep the central Delta, and insert each later entry on the left or on the right according to its L or R label.",
        caption: "Insert each entry on the left or right of Delta.",
      },
      {
        at: finalConfirmEnd,
        text: "This gives the word i Delta of C.",
        caption: "This gives i_Δ(C).",
      },
      {
        at: step3Start + 0.05,
        text: "Now build the weave from i Delta of C to w0.",
        caption: "Build the weave from i_Δ(C) to w0.",
      },
      {
        at: step3StrandStart,
        text: "Place i Delta of C on the top boundary of this weave.",
        caption: "Place i_Δ(C) on the top boundary.",
      },
      {
        at: step3StripStart,
        text: "Construct it one trivalent vertex at a time.",
        caption: "Construct one trivalent vertex at a time.",
      },
    );

    const triRecords = step3StripTimings
      .map((timing, idx) => ({ timing, idx, strip: step3ExactStrips[idx] }))
      .filter((record) => record.timing.isTri)
      .slice(0, 3);
    let previousTriIdx = -1;
    triRecords.forEach((record, localIdx) => {
      const ordinal = ordinals[localIdx] ?? `number ${localIdx + 1}`;
      const prepTiming = record.timing;
      cues.push({
        at: prepTiming.start + 0.04,
        text: `For the ${ordinal} trivalent vertex, use 4-valent and 6-valent moves to bring equal colors together.`,
        caption: `Bring equal colors together.`,
      });
      cues.push({
        at: record.timing.start + record.timing.span * 0.56,
        text: `Then attach them by one trivalent vertex.`,
        caption: `Attach by one trivalent vertex.`,
      });
      previousTriIdx = record.idx;
    });
    if (step3StripTimings.filter((timing) => timing.isTri).length > triRecords.length) {
      const lastDetailed = triRecords[triRecords.length - 1];
      cues.push({
        at: lastDetailed
          ? lastDetailed.timing.start + lastDetailed.timing.span + 0.16
          : step3StripStart + 0.16,
        text: "The remaining trivalent vertices are constructed in the same way.",
        caption: "Construct the remaining trivalent vertices in the same way.",
      });
    }
    cues.push(
      {
        at: step4Start + 0.18,
        text: "This gives the weave from i Delta of C to w0.",
        caption: "This gives the weave i_Δ(C) to w0.",
      },
      {
        at: step4BoundaryEnd,
        text: "The top weave connects the top boundary Delta i to the bottom boundary i Delta of C.",
        caption: "The top weave connects Δ i to i_Δ(C).",
      },
      {
        at: step4TopRevealStart + 0.12,
        text: "Only 4-valent and 6-valent vertices appear in the top weave.",
        caption: "Only 4-valent and 6-valent vertices appear in the top weave.",
      },
      {
        at: step4FinalCleanStart,
        text: "Finally, vertically concatenate the top weave with the weave below. This gives W Delta of C.",
        caption: "Concatenate the two weaves to obtain W_Δ(C).",
      },
    );
    narrationCues = cues
      .filter((cue) => cue.at <= storyEnd)
      .sort((left, right) => left.at - right.at)
      .map((cue, idx) => ({ ...cue, audio: `cue-${String(idx + 1).padStart(2, "0")}.wav` }));
    prepareNarrationAudio();
  }

  buildNarrationCues();

  function setKeyboardStops() {
    const stops = [];
    function push(value) {
      const next = clamp(value, 0, storyEnd);
      if (!Number.isFinite(next)) return;
      stops.push(next);
    }

    push(0);
    push(MARKS.wordEnd);
    push(MARKS.deltaEnd);
    push(MARKS.lrEnd);
    push(MARKS.countEnd);
    push(MARKS.locateEnd);
    rows.forEach((_, rowIdx) => {
      if (rowIdx < 3) push(rowTiming(rowIdx).end);
    });
    push(MARKS.chainEnd);
    push(MARKS.step2DeltaEnd);
    push(MARKS.step2RInitEnd);
    chainEntries.forEach((_, idx) => {
      if (idx < 3) push(appendTiming(idx).end);
    });
    push(appendEnd);
    push(sdeltaLiftEnd);
    push(iDeltaDeltaEnd);
    chainEntries.forEach((_, idx) => push(iDeltaEntryTiming(idx).end));
    push(step3StrandEnd);
    const nextTrivalentStops = [];
    const nextTrivalentRecords = [];
    step3StripTimings.forEach((timing, idx) => {
      if (timing.isTri) {
        const stop = step3StripTiming(idx).holdEnd;
        push(stop);
        nextTrivalentStops.push(stop);
        nextTrivalentRecords.push({
          stop,
          stripIndex: idx,
          sourceIndex: step3ExactStrips[idx]?.sourceIndex ?? null,
          entryLabel: step3ExactStripItems[idx]?.move?.entryLabel ?? "",
          sourceSide: step3ExactStripItems[idx]?.move?.sourceSide ?? "",
          sourceGenerator: step3ExactStripItems[idx]?.move?.sourceGenerator ?? null,
        });
      }
    });
    push(step4BottomMoveEnd);
    push(step4BoundaryEnd);
    push(step4TopRevealEnd);
    push(step4FinalCleanEnd);
    push(step4FinalEnd);

    localKeyboardStops = stops
      .sort((a, b) => a - b)
      .filter((value, idx, values) => idx === 0 || Math.abs(value - values[idx - 1]) > 0.045);
    localTrivalentStops = nextTrivalentStops
      .sort((a, b) => a - b)
      .filter((value, idx, values) => idx === 0 || Math.abs(value - values[idx - 1]) > 0.045);
    localTrivalentRecords = nextTrivalentRecords
      .sort((a, b) => a.stop - b.stop)
      .filter((record, idx, values) => idx === 0 || Math.abs(record.stop - values[idx - 1].stop) > 0.045);
  }

  setKeyboardStops();

  function placeToken(token, x, y, scale = 1) {
    setTransform(token.group, x, y, scale);
  }

  function moveToken(token, from, to, amount, fromScale = 1, toScale = 1) {
    const t = smoothstep(amount);
    placeToken(
      token,
      lerp(from.x, to.x, t),
      lerp(from.y, to.y, t),
      lerp(fromScale, toScale, t),
    );
  }

  function setFinalGlow(token, amount) {
    const value = clamp(amount);
    token.group.style.filter = value > 0.01
      ? `drop-shadow(0 0 4px rgba(31, 95, 191, ${(0.12 * value).toFixed(3)}))`
      : "";
  }

  function addSourceFocusRing(token) {
    const ring = svgEl("circle", {
      class: "source-focus-ring",
      cx: 0,
      cy: 0,
      r: 21,
    });
    token.group.insertBefore(ring, token.group.firstChild);
  }

  function routeHorizontalThenVertical(from, to, amount, split = 0.58) {
    const t = smoothstep(amount);
    if (t < split) {
      const horizontal = smoothstep(t / split);
      return {
        x: lerp(from.x, to.x, horizontal),
        y: from.y,
      };
    }
    const vertical = smoothstep((t - split) / (1 - split));
    return {
      x: to.x,
      y: lerp(from.y, to.y, vertical),
    };
  }

  function chainScreenPosition(x, y, amount) {
    const scale = lerp(1, 0.76, amount);
    return {
      x: lerp(0, 8, amount) + x * scale,
      y: lerp(0, -176, amount) + y * scale,
    };
  }

  function appendLaneX(from, to) {
    const distance = Math.abs(to.x - from.x);
    const outward = Math.max(36, Math.min(52, distance * 0.34));
    return Math.max(from.x, to.x) + outward;
  }

  function routeThroughRightLane(from, to, amount) {
    const t = smoothstep(amount);
    const laneX = appendLaneX(from, to);
    const c1 = { x: laneX, y: from.y };
    const c2 = { x: laneX, y: to.y };
    const omt = 1 - t;
    return {
      x: omt ** 3 * from.x + 3 * omt ** 2 * t * c1.x + 3 * omt * t ** 2 * c2.x + t ** 3 * to.x,
      y: omt ** 3 * from.y + 3 * omt ** 2 * t * c1.y + 3 * omt * t ** 2 * c2.y + t ** 3 * to.y,
    };
  }

  function routeThroughRightLanePath(from, to) {
    const laneX = appendLaneX(from, to);
    return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} C ${laneX.toFixed(2)} ${from.y.toFixed(2)} ${laneX.toFixed(2)} ${to.y.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
  }

  function routeThroughUpperLane(from, to, amount, laneY) {
    const t = smoothstep(amount);
    const c1 = { x: from.x, y: lerp(from.y, to.y, 0.38) };
    const c2 = { x: to.x, y: lerp(from.y, to.y, 0.62) };
    const omt = 1 - t;
    return {
      x: omt ** 3 * from.x + 3 * omt ** 2 * t * c1.x + 3 * omt * t ** 2 * c2.x + t ** 3 * to.x,
      y: omt ** 3 * from.y + 3 * omt ** 2 * t * c1.y + 3 * omt * t ** 2 * c2.y + t ** 3 * to.y,
    };
  }

  function routeThroughUpperLanePath(from, to, laneY) {
    const c1 = { x: from.x, y: lerp(from.y, to.y, 0.38) };
    const c2 = { x: to.x, y: lerp(from.y, to.y, 0.62) };
    return `M ${from.x.toFixed(2)} ${from.y.toFixed(2)} C ${c1.x.toFixed(2)} ${c1.y.toFixed(2)} ${c2.x.toFixed(2)} ${c2.y.toFixed(2)} ${to.x.toFixed(2)} ${to.y.toFixed(2)}`;
  }

  function routedCPosition(amount) {
    const t = smoothstep(amount);
    const source = { x: cFormulaX, y: cFormulaY };
    const lane = { x: cFormulaX, y: cWordY };
    const target = { x: cWordX, y: cWordY };
    if (t < 0.45) {
      const vertical = smoothstep(t / 0.45);
      return {
        x: source.x,
        y: lerp(source.y, lane.y, vertical),
      };
    }
    const horizontal = smoothstep((t - 0.45) / 0.55);
    return {
      x: lerp(lane.x, target.x, horizontal),
      y: target.y,
    };
  }

  function setProgress(progress) {
    const p = clamp(progress, 0, storyEnd);
    updateCaption(p);
    const wordMove = fade(p, MARKS.wordFocusEnd + 0.04, MARKS.wordEnd);
    const deltaMove = fade(p, MARKS.lrEnd + 0.04, MARKS.lrEnd + 0.24);
    const lrMove = fade(p, MARKS.lrFocusEnd + 0.04, MARKS.lrEnd);
    const chainIntroOut = fadeOut(p, MARKS.wordFocusEnd - 0.04, MARKS.wordEnd - 0.04);
    const iDataIn = 1;
    const lrDataIn = 1;
    const cGroupIn = 1;
    const cGroupOut = fadeOut(p, MARKS.introHold + 0.04, MARKS.introClearEnd);
    const deltaDataIn = fade(p, MARKS.lrEnd - 0.06, MARKS.lrEnd + 0.02);
    const deltaIntroVisible = fadeOut(p, MARKS.step2ArrangeEnd - 0.06, MARKS.step2ArrangeEnd + 0.02);
    const deltaIntroOpacity = deltaIntroVisible;
    const deltaObjectOut = 0;
    const iIntroTextOut = fadeOut(p, MARKS.wordFocusEnd - 0.06, MARKS.wordFocusEnd + 0.02);
    const deltaIntroTextOut = fadeOut(p, MARKS.deltaFocusEnd - 0.06, MARKS.deltaFocusEnd + 0.02);
    const deltaCaptionOut = fadeOut(p, MARKS.wordEnd, MARKS.wordEnd + 0.06);
    const lrIntroTextOut = fadeOut(p, MARKS.lrFocusEnd - 0.06, MARKS.lrFocusEnd + 0.02);
    const countIn = fade(p, MARKS.lrEnd + 0.30, MARKS.lrEnd + 0.42);
    const countOut = fadeOut(p, MARKS.locateEnd - 0.42, MARKS.locateEnd - 0.25);
    const cFormulaIn = fade(p, MARKS.countEnd + 0.04, MARKS.countEnd + 0.17);
    const cFormulaOut = fadeOut(p, MARKS.locateEnd - 0.10, MARKS.locateEnd + 0.03);
    const cLocate = fade(p, MARKS.locateEnd - 0.18, MARKS.locateEnd);
    const chainStarted = fade(p, MARKS.chainStart - 0.10, MARKS.chainStart - 0.04);
    const finalReview = fade(p, MARKS.chainEnd - 0.16, MARKS.chainEnd);
    const step2Arrange = fade(p, MARKS.step2Start, MARKS.step2ArrangeEnd);
    const step2DeltaMove = fade(p, MARKS.step2ArrangeEnd - 0.01, MARKS.step2DeltaEnd);
    const step2RInit = fade(p, MARKS.step2DeltaEnd, MARKS.step2RInitEnd);
    const sdeltaLift = fade(p, sdeltaLiftStart, sdeltaLiftEnd);
    const iDeltaDelta = fade(p, sdeltaLiftEnd, iDeltaDeltaEnd);
    const finalCleanup = fade(p, finalCleanupStart, finalCleanupEnd);
    const finalConfirm = fade(p, finalConfirmStart, finalConfirmStart + FINAL_CONFIRM_SPAN * 0.28)
      * fadeOut(p, finalConfirmEnd - FINAL_CONFIRM_SPAN * 0.28, finalConfirmEnd);
    const sdeltaVisible = lerp(1, 0.76, finalCleanup);
    const step3SDeltaPark = fade(p, step3SDeltaParkStart, step3SDeltaParkEnd);
    const step3Lift = fade(p, step3Start, step3LiftEnd);
    const step3StrandDraw = fade(p, step3StrandStart, step3StrandEnd);
    const step3ContextDim = fade(p, step3StrandStart, step3StrandEnd);
    const step4BottomMove = fade(p, step4Start, step4BottomMoveEnd);
    const step4BoundaryIn = fade(p, step4BottomMoveEnd - 0.08, step4BoundaryEnd);
    const step4ContextOut = fade(p, step4Start, step4BoundaryEnd);
    const step4TopReveal = clamp((p - step4TopRevealStart) / STEP4_TOP_REVEAL_SPAN);
    const step4FinalClean = fade(p, step4FinalCleanStart, step4FinalCleanEnd);
    const step4FinalIn = fade(p, step4FinalLabelStart, step4FinalEnd);
    const step4FinalZoom = fade(p, step4FinalCleanStart + 0.08, step4FinalCleanEnd);
    const step4Concat = fade(p, step4FinalCleanStart, step4FinalCleanEnd);
    const step4TopOffsetY = step4TopSeparatedY * (1 - step4Concat);
    const step3ExactStates = step3ExactStrips.map((strip, idx) => {
      const timing = step3StripTiming(idx);
      const draw = fade(p, timing.drawStart, timing.drawEnd);
      const inputDraw = strip.triInputPaths
        ? fade(p, timing.drawStart, timing.inputEnd)
        : draw;
      const outputDraw = strip.triOutputPaths
        ? fade(p, timing.outputStart, timing.outputEnd)
        : draw;
      const outputOpacity = strip.triOutputPaths
        ? fade(p, timing.outputStart, timing.outputEnd) * 0.42
        : 1;
      const vertex = strip.badge || strip.triVertex
        ? fade(p, timing.vertexStart, timing.vertexEnd)
        : fade(p, timing.drawStart, timing.drawEnd);
      const current = fade(p, timing.start, timing.start + 0.12)
        * fadeOut(p, timing.holdEnd - 0.18, timing.holdEnd);
      return {
        opacity: fade(p, timing.start, timing.start + 0.06),
        draw,
        inputDraw,
        outputDraw,
        outputOpacity,
        vertex,
        current,
      };
    });
    const step3SceneStates = step3MergeScenes.map((scene, idx) => {
      const start = step3StripTimings[idx]?.start ?? step3StripStart;
      const sourceFocus = fade(p, start - 0.34, start - 0.20)
        * fadeOut(p, start - 0.06, start + 0.04);
      const opacity = fade(p, start - 0.04, start + 0.06);
      const sliceStart = start + 0.06;
      const sliceArrive = start + STEP3_STRIP_SPAN * 0.36;
      const vertexStart = start + STEP3_STRIP_SPAN * 0.50;
      const vertexEnd = start + STEP3_STRIP_SPAN * 0.57;
      const outputStart = start + STEP3_STRIP_SPAN * 0.77;
      const outputEnd = start + STEP3_STRIP_SPAN * 0.96;
      const sliceDraw = fade(p, sliceStart, outputEnd);
      const inputDraw = fade(p, sliceStart, sliceArrive);
      const outputDraw = fade(p, outputStart, outputEnd);
      const vertex = fade(p, vertexStart, vertexEnd);
      const vertexHold = vertex * fadeOut(p, outputStart - STEP3_STRIP_SPAN * 0.06, outputStart);
      const partnerLocal = fade(p, sliceStart + STEP3_STRIP_SPAN * 0.18, sliceArrive);
      const focus = Math.max(sourceFocus, sliceDraw * (1 - vertex * 0.45));
      const revealY = lerp(
        lerp(scene.topY, scene.triVertex.y, inputDraw),
        scene.bottomY,
        outputDraw,
      );
      return {
        sourceFocus,
        opacity,
        partnerLocal,
        vertex,
        vertexHold,
        focus,
        revealY,
      };
    });

    setOpacity(chainIntroRole, 0);
    setOpacity(chainIntroLabel, 0);
    setOpacity(chainIntroText, chainIntroOut * (1 - chainStarted));
    setOpacity(chainIntroDet, 0);
    setOpacity(chainIntroI, chainIntroOut * (1 - chainStarted));
    setOpacity(chainIntroTail, 0);
    [iIntroPrefix, iSuffix].forEach((node) => setOpacity(node, iIntroTextOut * iDataIn));
    setOpacity(deltaIntroPrefix, deltaCaptionOut);
    setOpacity(deltaObjectLabel, deltaObjectOut);
    setOpacity(deltaSuffix, deltaIntroTextOut * deltaDataIn);
    setOpacity(cIntroPrefix, lrIntroTextOut * lrDataIn);
    setOpacity(cGroupBrace, cGroupIn * cGroupOut * (1 - chainStarted));
    setOpacity(cGroupLabel, cGroupIn * cGroupOut * (1 - chainStarted));

    setAttrs(iLabel, {
      x: lerp(iIntroLabelX, wordLabelX, smoothstep(wordMove)),
      y: lerp(introWordY, wordY + 7, smoothstep(wordMove)),
    });
    iLabel.classList.toggle("is-focus", active(p, MARKS.introClearEnd + 0.04, MARKS.wordFocusEnd));
    const contextRetire = fade(p, MARKS.chainEnd + 0.06, MARKS.step2Start - 0.04);
    const inputContextOpacity = lerp(1 - finalReview, 0, contextRetire) * sdeltaVisible;
    setOpacity(iLabel, inputContextOpacity * iDataIn);
    const deltaLabelPos = routeHorizontalThenVertical(
      { x: deltaIntroLabelX, y: introDeltaY },
      { x: deltaLabelX, y: deltaY + 6 },
      deltaMove,
    );
    setTransform(deltaLabel, deltaLabelPos.x, deltaLabelPos.y, 1);
    deltaLabel.classList.toggle("is-focus", active(p, MARKS.wordEnd + 0.08, MARKS.deltaFocusEnd));
    setOpacity(deltaLabel, deltaIntroOpacity * deltaDataIn);
    setAttrs(lrLabel, {
      x: lerp(lrIntroLabelX + 6, lrLabelX, smoothstep(lrMove)),
      y: lerp(introLRY, lrY + 6, smoothstep(lrMove)),
    });
    setOpacity(lrLabel, fadeOut(p, MARKS.lrEnd + 0.02, MARKS.lrEnd + 0.07) * lrDataIn);

    iTokens.forEach((token, idx) => {
      moveToken(
        token,
        { x: iIntroStartX + idx * introITokenSpacing, y: introWordY },
        { x: wordXs[idx], y: wordY },
        wordMove,
      );
      token.group.classList.toggle("is-focus", active(p, MARKS.introClearEnd + 0.04, MARKS.wordFocusEnd));
      setOpacity(token.group, inputContextOpacity * iDataIn);
    });

    deltaTokens.forEach((token, idx) => {
      const from = { x: deltaIntroStartX + idx * introDeltaTokenSpacing, y: introDeltaTokenY };
      const to = { x: deltaX0 + idx * deltaSpacing, y: deltaY };
      const pos = routeHorizontalThenVertical(from, to, deltaMove);
      const step2Pos = routeHorizontalThenVertical(
        pos,
        { x: step2DeltaXs[idx], y: step2CenterY },
        step2DeltaMove,
        0.48,
      );
      placeToken(
        token,
        step2Pos.x,
        step2Pos.y + sdeltaLiftY * sdeltaLift + step3SDeltaParkY * step3SDeltaPark,
        lerp(lerp(1, 0.78, smoothstep(deltaMove)), 1, smoothstep(step2DeltaMove)),
      );
      token.group.classList.toggle("is-focus", active(p, MARKS.wordEnd + 0.08, MARKS.deltaFocusEnd));
      const deltaStep2Opacity = step2DeltaMove * sdeltaVisible * (1 - step4ContextOut);
      setOpacity(token.group, Math.max(deltaIntroOpacity * deltaDataIn, deltaStep2Opacity));
    });

    lrTokens.forEach((token, idx) => {
      const rowIdx = idx + 1;
      const rowRef = rowRefs[rowIdx];
      const rowMove = rowRef ? rowAmount(p, rowIdx) : 0;
      const sideMove = fade(rowMove, 0.02, 0.28);
      const arranged = {
        x: lerp(lrIntroStartX + idx * introLRSpacing, lrXs[idx], smoothstep(lrMove)),
        y: lerp(introLRY, lrY, smoothstep(lrMove)),
      };
      const target = rowRef ? { x: rowSideX, y: rowRef.y } : arranged;
      moveToken(token, arranged, target, sideMove);
      const countAttention = countIn * countOut;
      token.group.classList.toggle("is-focus", active(p, MARKS.deltaEnd + 0.05, MARKS.lrFocusEnd));
      token.group.classList.toggle("is-counting", lr[idx] === "L" && countAttention > 0.15 && countIn < 0.95);
      token.group.classList.toggle("is-moving", sideMove > 0.04 && sideMove < 0.96);
      setOpacity(token.group, (1 - finalReview) * lrDataIn);
    });

    const countPulseCount = Math.floor(lerp(0, lIndices.length + 0.999, countIn));
    lIndices.forEach((idx, order) => {
      lrTokens[idx].group.classList.toggle("is-counted", countOut > 0.1 && countPulseCount > order);
    });
    setOpacity(countText, countIn * countOut);
    cFormulaPieces.forEach((piece) => setOpacity(piece, cFormulaIn * cFormulaOut));

    const cAtRow = { x: rowSideX, y: rowRefs[0]?.y ?? rowY0 };
    const firstRow = rowAmount(p, 0);
    const cToRow = fade(p, MARKS.chainStart + 0.03, MARKS.chainStart + 0.17);
    const cBeforeRow = routedCPosition(cLocate);
    moveToken(cMarker, cBeforeRow, cAtRow, cToRow);
    cMarker.group.classList.toggle("is-moving", (cLocate > 0.05 && cLocate < 0.96) || (cToRow > 0.04 && cToRow < 0.96));
    setOpacity(cMarker.group, cFormulaIn * (1 - finalReview));
    const cRetired = appendRefs[0]
      ? fade(p, appendTiming(0).retireFadeStart, appendTiming(0).retireFadeEnd)
      : 0;
    setOpacity(chainSideC.group, finalReview * (1 - cRetired));
    chainSideLR.forEach((token, idx) => {
      const timing = appendTiming(idx + 1);
      const retired = fade(p, timing.retireFadeStart, timing.retireFadeEnd);
      setOpacity(token.group, finalReview * (1 - retired));
    });

    setOpacity(cBrace, fade(cLocate, 0.72, 1) * fadeOut(firstRow, 0.30, 0.42));
    setOpacity(chainLayer, chainStarted);
    const chainRetire = fadeOut(p, MARKS.step2RInitEnd, MARKS.step2RInitEnd + 0.12);
    const spineToC = fade(p, MARKS.chainStart + 0.03, MARKS.chainStart + 0.17);
    const spineRows = rowRefs.reduce((extent, _ref, idx) => {
      const rowIn = fade(rowAmount(p, idx), 0.02, 0.12);
      return Math.max(extent, rowIn * (idx + 1));
    }, spineToC);
    const spineEndY = spineRows <= 1
      ? lerp(spineY0, rowY0, spineRows)
      : rowY0 + (spineRows - 1) * rowGap;
    setAttrs(finalSpineMain, { y2: Math.min(spineEndY, spineY1) });
    setOpacity(finalSpine, Math.max(spineToC, fade(firstRow, 0.02, 0.12)) * chainRetire);
    finalSpineTicks.forEach((tick, idx) => {
      const tickIn = idx === 0
        ? spineToC
        : fade(rowAmount(p, idx), 0.02, 0.12);
      setOpacity(tick, tickIn * chainRetire);
    });
    setTransform(chainLayer, lerp(0, 8, step2Arrange), lerp(0, -176, step2Arrange), lerp(1, 0.76, step2Arrange));
    setTransform(
      step2Layer,
      0,
      sdeltaLiftY * sdeltaLift + step3SDeltaParkY * step3SDeltaPark,
      1,
    );
    setOpacity(step2Layer, sdeltaVisible * (1 - step4ContextOut));
    setTransform(iDeltaLayer, 0, step3LiftY * step3Lift, 1);
    setOpacity(iDeltaLayer, 1 - step4ContextOut);
    const finalZoomScale = lerp(1, 0.86, step4FinalZoom);
    const finalZoomCenterX = 720;
    const finalZoomCenterY = 500;
    const step4BottomXScale = lerp(1, step4BottomFinalXScale, step4BottomMove);
    const step4BottomYScale = lerp(1, step4BottomFinalYScale, step4BottomMove);
    const step4BottomTx = 720 * (1 - step4BottomXScale);
    const step4BottomTy = step4BottomFinalTy * step4BottomMove;
    const zoomedBottomXScale = step4BottomXScale * finalZoomScale;
    const zoomedBottomYScale = step4BottomYScale * finalZoomScale;
    const zoomedBottomTx = finalZoomScale * step4BottomTx + (1 - finalZoomScale) * finalZoomCenterX;
    const finalShiftY = -52 * step4FinalZoom;
    const zoomedBottomTy = finalZoomScale * step4BottomTy + (1 - finalZoomScale) * finalZoomCenterY + finalShiftY;
    const step4AuxiliaryVisible = p < step4FinalCleanStart ? 1 : 0;
    step3Layer.setAttribute(
      "transform",
      `matrix(${zoomedBottomXScale.toFixed(4)} 0 0 ${zoomedBottomYScale.toFixed(4)} ${zoomedBottomTx.toFixed(2)} ${zoomedBottomTy.toFixed(2)})`,
    );
    setTransform(step4BoundaryGroup, 0, step4TopOffsetY + 22 * (1 - step4BoundaryIn), 1);
    setOpacity(step4Layer, step4BoundaryIn);
    step4TopWeaveGroup.setAttribute(
      "transform",
      `matrix(${finalZoomScale.toFixed(4)} 0 0 ${finalZoomScale.toFixed(4)} ${((1 - finalZoomScale) * finalZoomCenterX).toFixed(2)} ${(((1 - finalZoomScale) * finalZoomCenterY) + finalShiftY + step4TopOffsetY).toFixed(2)})`,
    );
    setAttrs(step4TopClipRect, {
      y: step4TopY - 14,
      height: (step4TopBottomY - step4TopY + 32) * step4TopReveal,
    });
    setOpacity(step4TopWeaveGroup, fade(p, step4TopRevealStart - 0.04, step4TopRevealStart + 0.08));
    setTransform(step4BottomLabel, 342, (step4TopBottomY + step4BottomFinalBottomY) / 2 + 8, 1);
    setOpacity(step4BoundaryGroup, step4BoundaryIn * step4AuxiliaryVisible);
    setOpacity(step4BottomBracket, fade(p, step4Start + 0.16, step4BottomMoveEnd) * step4AuxiliaryVisible);
    setOpacity(step4BottomLabel, fade(p, step4Start + 0.16, step4BottomMoveEnd) * step4AuxiliaryVisible);
    setTransform(step4TopBracket, 0, step4TopOffsetY, 1);
    setTransform(step4TopLabel, 342, (step4TopY + step4TopBottomY) / 2 + 8 + step4TopOffsetY, 1);
    setOpacity(step4TopBracket, fade(p, step4TopRevealEnd - 0.18, step4TopRevealEnd) * step4AuxiliaryVisible);
    setOpacity(step4TopLabel, fade(p, step4TopRevealEnd - 0.18, step4TopRevealEnd) * step4AuxiliaryVisible);
    setTransform(step4FinalLabel, 720, step4FinalLabelY, 1);
    setOpacity(step4FinalLabel, step4FinalIn);
    setOpacity(step2Label, fade(step2DeltaMove, 0.68, 1));
    step2RTags.forEach((token, idx) => {
      const start = idx * (0.60 / Math.max(rxw.length - 1, 1));
      const tagMove = fade(step2RInit, start, start + 0.22);
      const x = step2DeltaXs[idx] + 14;
      moveToken(
        token,
        { x, y: step2CenterY - 5 },
        { x: x + 1, y: step2CenterY + 25 },
        tagMove,
        0.9,
        1,
      );
      setOpacity(token.group, fade(tagMove, 0.08, 0.24));
    });
    appendRefs.forEach((appendRef, idx) => {
      const timing = appendTiming(idx);
      const appendProgress = fade(p, timing.start, timing.end);
      const appendMove = fade(p, timing.moveStart, timing.moveEnd);
      const conversionStart = appendRef.rawCarrier
        ? timing.transformStart + APPEND_SPAN * 0.10
        : timing.transformStart;
      const appendTransform = fade(p, conversionStart, timing.transformEnd);
      const transformHold = active(p, timing.transformStart, timing.moveStart);
      const source = appendRef.rowRef
        ? chainScreenPosition(colorX, appendRef.rowRef.y, step2Arrange)
        : { x: appendRef.x, y: step2CenterY };
      const target = { x: appendRef.x, y: step2CenterY };
      const routed = routeThroughRightLane(source, target, appendMove);
      const sideSource = appendRef.rowRef && idx > 0
        ? chainScreenPosition(rowSideX, appendRef.rowRef.y, step2Arrange)
        : { x: source.x + 15, y: source.y + 25 };
      const sideTarget = { x: appendRef.x + 15, y: step2CenterY + 25 };
      const sideMove = fade(p, timing.sideStart, timing.sideEnd);
      const routedSide = routeThroughRightLane(
        sideSource,
        sideTarget,
        sideMove,
      );
      const guideStart = timing.moveStart - APPEND_SPAN * 0.10;
      const guideEnd = timing.moveStart - APPEND_SPAN * 0.02;
      const guideDraw = fade(p, guideStart, guideEnd);
      setAttrs(appendRef.guidePath, { d: routeThroughRightLanePath(source, target) });
      setDashProgress(appendRef.guidePath, guideDraw);
      setOpacity(appendRef.guidePath, 0);
      const scale = lerp(0.78, 1, smoothstep(appendMove));
      const sideScale = lerp(0.86, 1, smoothstep(sideMove));
      const rowFocus = fade(appendProgress, 0.02, 0.16) * fadeOut(appendProgress, 0.86, 1);
      appendRef.rowRef?.group.classList.toggle("is-append-source", rowFocus > 0.08);
      appendRef.rowRef?.colorDot.classList.toggle("is-append-source", rowFocus > 0.08);
      appendRef.rowRef?.colorText.classList.toggle("is-append-source", rowFocus > 0.08);
      appendRef.sideSourceToken?.group.classList.toggle("is-append-source", rowFocus > 0.08);
      placeToken(appendRef.carrier, routed.x, routed.y, lerp(0.88, 1.04, smoothstep(appendMove)));
      appendRef.carrier.group.classList.toggle("is-moving", appendMove > 0.04 && appendMove < 0.98);
      appendRef.carrier.group.classList.toggle(
        "is-focus",
        appendRef.rawCarrier
          ? transformHold
          : active(p, timing.focusStart, timing.moveStart),
      );
      appendRef.carrier.group.classList.toggle("is-transforming", Boolean(appendRef.rawCarrier && transformHold));
      if (appendRef.rawCarrier) {
        placeToken(appendRef.rawCarrier, source.x, source.y, 0.92);
        appendRef.rawCarrier.group.classList.toggle("is-focus", active(p, timing.focusStart, timing.transformEnd));
        appendRef.rawCarrier.group.classList.toggle("is-transforming", active(p, conversionStart, timing.transformEnd));
        setOpacity(
          appendRef.rawCarrier.group,
          fade(p, timing.focusStart, timing.focusEnd) * fadeOut(p, conversionStart, timing.transformEnd),
        );
        setOpacity(appendRef.carrier.group, appendTransform);
      } else {
        setOpacity(appendRef.carrier.group, fade(p, timing.focusStart, timing.focusEnd));
      }
      placeToken(appendRef.token, appendRef.x, step2CenterY, 1);
      placeToken(appendRef.sideToken, routedSide.x, routedSide.y, sideScale);
      if (appendRef.rawToken) placeToken(appendRef.rawToken, source.x, source.y, 1);
      if (appendRef.rawToken) setOpacity(appendRef.rawToken.group, 0);
      setOpacity(appendRef.token.group, 0);
      if (appendRef.starToken) {
        placeToken(appendRef.starToken, source.x + 24, source.y - 14, 1.22);
        setOpacity(
          appendRef.starToken.group,
          fade(p, timing.transformStart, timing.transformStart + APPEND_SPAN * 0.06)
            * fadeOut(p, conversionStart, timing.transformEnd),
        );
      }
      setOpacity(appendRef.sideToken.group, fade(p, timing.sideStart, timing.sideEnd));
    });
    iDeltaTokens.forEach((token, idx) => {
      const deltaCopyMove = fade(iDeltaDelta, 0.32, 1);
      moveToken(
        token,
        { x: step2DeltaXs[idx], y: step2CenterY + sdeltaLiftY },
        { x: iDeltaXs[idx], y: iDeltaBaseY },
        deltaCopyMove,
        1,
        1.08,
      );
      setOpacity(token.group, fade(iDeltaDelta, 0.24, 0.42));
    });
    setOpacity(iDeltaBracket, fade(iDeltaDelta, 0.68, 0.92) * fadeOut(p, step3Start, step3LiftEnd));
    setOpacity(iDeltaLabel, fade(iDeltaDelta, 0.02, 0.20));
    iDeltaEntryRefs.forEach((ref, idx) => {
      const timing = iDeltaEntryTiming(idx);
      const amount = fade(p, timing.moveStart, timing.moveEnd);
      const source = { x: ref.appendRef.x, y: step2CenterY + sdeltaLiftY };
      const routed = routeThroughUpperLane(source, ref.target, amount, iDeltaBaseY - 54);
      ref.appendRef.carrier.group.classList.toggle("is-idelta-source", active(p, timing.sideFocusStart, timing.sideFocusEnd));
      ref.appendRef.sideToken.group.classList.toggle("is-idelta-focus", active(p, timing.sideFocusStart, timing.sideFocusEnd));
      const targetOpacity = fade(p, timing.targetStart, timing.targetStart + IDELTA_ENTRY_SPAN * 0.05)
        * fadeOut(p, timing.moveEnd - IDELTA_ENTRY_SPAN * 0.08, timing.moveEnd);
      const guideDraw = fade(p, timing.guideStart, timing.guideEnd);
      const guideOpacity = fade(p, timing.guideStart, timing.guideStart + IDELTA_ENTRY_SPAN * 0.04)
        * fadeOut(p, timing.moveEnd - IDELTA_ENTRY_SPAN * 0.08, timing.moveEnd);
      setOpacity(ref.targetMarker, targetOpacity);
      setDashProgress(ref.guidePath, guideDraw);
      setOpacity(ref.guidePath, guideOpacity);
      placeToken(ref.token, routed.x, routed.y, lerp(1, 1.08, smoothstep(amount)));
      setOpacity(ref.token.group, fade(p, timing.copyStart, timing.copyEnd));
    });
    iDeltaTokens.forEach((token) => setFinalGlow(token, finalConfirm));
    iDeltaEntryRefs.forEach((ref) => setFinalGlow(ref.token, finalConfirm));
    iDeltaLabel.style.filter = finalConfirm > 0.01
      ? `drop-shadow(0 0 8px rgba(17, 24, 39, ${(0.18 * finalConfirm).toFixed(3)}))`
      : "";
    iDeltaBracket.style.filter = finalConfirm > 0.01
      ? `drop-shadow(0 0 8px rgba(31, 95, 191, ${(0.22 * finalConfirm).toFixed(3)}))`
      : "";
    const activeWordKeys = new Set();
    const activeWordFocusByKey = new Map();
    function noteActiveWord(key, value = 1) {
      if (!key) return;
      activeWordKeys.add(key);
      activeWordFocusByKey.set(key, Math.max(activeWordFocusByKey.get(key) ?? 0, value));
    }
    const activeSourceIndices = new Set();
    let currentSourceIndex = null;
    let currentSourceFocus = 0;
    const sourceFocusByIndex = new Map();
    const sourceIndices = [...new Set(step3ExactStrips
      .map((strip) => strip.sourceIndex)
      .filter((sourceIndex) => sourceIndex !== null && sourceIndex >= 0))];
    sourceIndices.forEach((sourceIndex) => {
      const indices = step3ExactStrips
        .map((strip, idx) => (strip.sourceIndex === sourceIndex ? idx : null))
        .filter((idx) => idx !== null);
      if (indices.length === 0) return;
      const firstTiming = step3StripTiming(indices[0]);
      const triIdx = indices.find((idx) => step3ExactStrips[idx].triVertex);
      const endTiming = step3StripTiming(triIdx ?? indices[indices.length - 1]);
      const activeStart = firstTiming.start + 0.04;
      const focus = fade(p, activeStart - 0.02, activeStart + 0.10)
        * fadeOut(p, endTiming.outputEnd + 0.03, endTiming.outputEnd + 0.24);
      sourceFocusByIndex.set(sourceIndex, focus);
      if (focus > currentSourceFocus) {
        currentSourceIndex = sourceIndex;
        currentSourceFocus = focus;
      }
    });
    let activeTriSourceIndex = null;
    step3ExactStrips.forEach((strip, idx) => {
      if (!strip.triVertex) return;
      const state = step3ExactStates[idx];
      const timing = step3StripTiming(idx);
      if (state.opacity > 0.02 && state.outputDraw < 0.98 && p >= timing.start) {
        activeTriSourceIndex = strip.sourceIndex;
      }
    });
    if (activeTriSourceIndex !== null && activeTriSourceIndex >= 0) {
      sourceFocusByIndex.set(activeTriSourceIndex, Math.max(sourceFocusByIndex.get(activeTriSourceIndex) ?? 0, 1));
      currentSourceIndex = activeTriSourceIndex;
      currentSourceFocus = 1;
    }
    step3TopExtensions.forEach((extension) => {
      const sourceFocus = sourceFocusByIndex.get(extension.sourceIndex) ?? 0;
      setOpacity(extension.path, step3StrandDraw);
      setDashProgress(extension.path, 1);
      setSourceHighlight(extension.path, sourceFocus);
      extension.path.classList.toggle("is-current-source", false);
    });
    step3ExactStrips.forEach((strip, idx) => {
      const state = step3ExactStates[idx];
      const timing = step3StripTiming(idx);
      const isFutureStrip = p < timing.start;
      const stripReveal = isFutureStrip
        ? 0
        : p >= timing.holdEnd
          ? 1
          : fade(p, timing.start, timing.holdEnd);
      const stripTopY = (strip.topY ?? 0) - 12;
      const stripBottomY = (strip.botY ?? stripTopY) + 18;
      let stripRevealY = lerp(stripTopY, stripBottomY, stripReveal);
      let triOutputHold = false;
      let triOutputOpacity = 1;
      let triVertexHold = false;
      if (strip.triVertex && !isFutureStrip && p < timing.holdEnd) {
        const vertexPauseY = Math.min(stripBottomY, strip.triVertex.y + 6);
        const vertexArrival = timing.start + STEP3_STRIP_SPAN * 0.42;
        const numberEnd = Math.min(timing.holdEnd - 0.30, vertexArrival + 0.72);
        if (p < vertexArrival) {
          stripRevealY = lerp(stripTopY, vertexPauseY, fade(p, timing.start, vertexArrival));
        } else if (p < numberEnd) {
          stripRevealY = vertexPauseY;
          triOutputHold = true;
          triVertexHold = true;
        } else {
          const outputReveal = fade(p, numberEnd, timing.holdEnd);
          stripRevealY = lerp(vertexPauseY, stripBottomY, outputReveal);
          triOutputOpacity = fade(p, numberEnd, numberEnd + STEP3_STRIP_SPAN * 0.12);
        }
      }
      const clipRect = step3StripClipRects[idx];
      if (clipRect) {
        setAttrs(clipRect, {
          x: 0,
          y: stripTopY,
          width: 1440,
          height: Math.max(0, stripRevealY - stripTopY),
        });
      }
      setOpacity(strip.group, isFutureStrip ? 0 : step3StrandDraw);
      const isTriStrip = Boolean(strip.triVertex);
      const isActiveTri = isTriStrip && state.opacity > 0.02 && state.outputDraw < 0.98 && p >= timing.start;
      const isCompletedTri = isTriStrip && !isActiveTri && state.vertex > 0.98 && state.outputDraw > 0.98;
      const sourceFocus = sourceFocusByIndex.get(strip.sourceIndex) ?? 0;
      strip.paths.forEach((path) => {
        setDashProgress(path, 1);
        path.style.opacity = "1";
      });
      if (strip.triOutputPaths) {
        strip.triOutputPaths.forEach((path) => {
          path.style.opacity = triOutputHold ? "0" : String(triOutputOpacity);
        });
      }
      strip.dots.forEach((dot) => {
        const dotY = Number.parseFloat(dot.getAttribute("cy") ?? "0");
        setOpacity(dot, triOutputHold || stripRevealY >= dotY + 7 ? step3StrandDraw : 0);
      });
      if (strip.badge) {
        const badgeY = strip.triVertex?.y ?? 0;
        setTransform(strip.badge, 14, -10, 1);
        setOpacity(strip.badge, triVertexHold || stripRevealY >= badgeY + 24 ? step3StrandDraw : 0);
      }
      strip.group.classList.toggle("is-current", state.current > 0.08);
      strip.group.classList.toggle("is-active-tri", isActiveTri);
      strip.group.classList.toggle("is-completed-tri", isCompletedTri);
      const isSourceChain = currentSourceIndex !== null
        && strip.sourceIndex === currentSourceIndex
        && sourceFocus > 0.02
        && state.opacity > 0.02;
      strip.group.classList.toggle("is-source-chain", isSourceChain);
      strip.paths.forEach((path) => setSourceHighlight(path, 0));
      const overlayPath = step3SourceOverlayPaths[idx];
      if (overlayPath) {
        setOpacity(overlayPath, 0);
      }
      if (isSourceChain) {
        strip.paths.forEach((path) => {
          if (path.classList.contains("source-carry")) {
            setDashProgress(path, 1);
            path.style.opacity = "";
          }
        });
        activeSourceIndices.add(strip.sourceIndex);
        noteActiveWord(`chain:${strip.sourceIndex}`, sourceFocus);
      }
    });
    step3MergeScenes.forEach((scene, idx) => {
      const state = step3SceneStates[idx];
      setOpacity(scene.group, state.opacity);
      setAttrs(scene.clipRect, {
        y: scene.topY - 10,
        height: Math.max(0, state.revealY - scene.topY + 20),
      });
      if (scene.partnerBackgroundPath) setOpacity(scene.partnerBackgroundPath, 1);
      setOpacity(scene.partnerInputPath, 1);
      setOpacity(scene.dot, state.vertex);
      setOpacity(scene.vertexHalo, state.vertexHold * 0.88);
      setOpacity(scene.badge, state.vertex);
      if (step3SourceHalos[idx]) {
        setOpacity(step3SourceHalos[idx], Math.max(state.sourceFocus, state.focus * 0.70));
      }
      if (state.focus > 0.08 && scene.sourceWordRef?.key) noteActiveWord(scene.sourceWordRef.key, state.focus);
      if (state.sourceFocus > 0.08 && scene.sourceIndex !== null) activeSourceIndices.add(scene.sourceIndex);
    });
    iDeltaWordRefs.forEach((ref) => {
      const focus = ref.sourceIndex !== null
        ? Math.max(activeWordFocusByKey.get(ref.key) ?? 0, sourceFocusByIndex.get(ref.sourceIndex) ?? 0)
        : activeWordFocusByKey.get(ref.key) ?? (activeWordKeys.has(ref.key) ? 1 : 0);
      const ring = ref.token.group.querySelector(".source-focus-ring");
      if (ring) setOpacity(ring, focus);
      ref.token.group.classList.toggle("is-weave-source-focus", focus > 0.08);
    });
    const sourceLabelOpacity = fade(p, step3Start - 0.03, step3Start + 0.05)
      * fadeOut(p, step4Start - 0.08, step4Start + 0.02);
    iDeltaSourceLabels.forEach((label) => {
      const focus = Math.max(
        sourceFocusByIndex.get(label.sourceIndex) ?? 0,
        activeSourceIndices.has(label.sourceIndex) ? 1 : 0,
      );
      setOpacity(label.group, sourceLabelOpacity);
      label.group.classList.toggle("is-active", focus > 0.08);
    });
    iDeltaEntryRefs.forEach((ref) => {
      const activeSource = activeSourceIndices.has(ref.sourceIndex);
      ref.appendRef.carrier.group.classList.toggle("is-step3-current", activeSource);
      ref.appendRef.sideToken.group.classList.toggle("is-step3-current", activeSource);
    });

    rowRefs.forEach((ref, rowIdx) => {
      const amount = rowAmount(p, rowIdx);
      const visible = fade(amount, 0.03, 0.18);
      const guideOpacity = 0;
      const focusOpacity = visible;
      const baseOpacity = lerp(focusOpacity, visible, finalReview);
      const step2Opacity = appendRefs.reduce((opacity, appendRef, idx) => {
        const timing = appendTiming(idx);
        const appendProgress = fade(p, timing.start, timing.end);
        const focus = fade(appendProgress, 0.02, 0.18) * fadeOut(appendProgress, 0.82, 1);
        const dimmed = 1;
        return lerp(opacity, visible * dimmed, focus);
      }, baseOpacity);
      const ownAppendTiming = appendRefs[rowIdx] ? appendTiming(rowIdx) : null;
      const retireMove = ownAppendTiming
        ? fade(p, ownAppendTiming.retireMoveStart, ownAppendTiming.retireMoveEnd)
        : 0;
      const retireFade = ownAppendTiming
        ? fade(p, ownAppendTiming.retireFadeStart, ownAppendTiming.retireFadeEnd)
        : 0;
      setOpacity(ref.group, Math.max(step2Opacity, guideOpacity) * (1 - retireFade));
      setTransform(ref.group, -18 * retireMove, -5 * retireMove, 1 - 0.018 * retireMove);

      const guideDraw = fade(amount, 0.08, 0.20);
      setAttrs(ref.dropGuide, {
        x1: ref.endpointX,
        y1: wordY + 29,
        x2: ref.endpointX,
        y2: lerp(wordY + 29, ref.y - rowCellHeight * 0.54, guideDraw),
      });
      setOpacity(ref.dropGuide, guideOpacity);

      ref.rowLetters.forEach(({ pos, token }) => {
        const letterMove = fade(amount, 0.30, 0.44);
        setOpacity(token.group, fade(amount, 0.26, 0.34));
        moveToken(
          token,
          { x: wordXs[pos - 1], y: wordY },
          { x: wordXs[pos - 1], y: ref.y },
          letterMove,
          0.96,
          1,
        );
      });

      const envelopeDraw = fade(amount, 0.52, 0.62);
      setDashProgress(ref.envelopeRule, envelopeDraw);
      setOpacity(ref.envelopeRule, fade(amount, 0.50, 0.54));

      const endpointAttention = fade(amount, 0.72, 0.76) * fadeOut(amount, 0.81, 0.85);
      const scanAmount = fade(amount, 0.81, 0.88);
      const scanOpacity = ref.isDegenerateBox
        ? 0
        : fade(amount, 0.81, 0.84)
          * fade(scanAmount, 0.35, 0.45)
          * fadeOut(amount, 0.90, 0.93);
      setAttrs(ref.scanLine, {
        x1: ref.endpointX,
        y1: ref.scanY,
        x2: lerp(ref.endpointX, ref.matchX, scanAmount),
        y2: ref.scanY,
      });
      setOpacity(ref.endpointHalo, endpointAttention);
      setOpacity(ref.scanLine, scanOpacity);
      setOpacity(ref.matchHalo, ref.isDegenerateBox ? 0 : fade(amount, 0.88, 0.90) * fadeOut(amount, 0.93, 0.95));

      const boxAmount = ref.isDegenerateBox ? fade(amount, 0.88, 0.94) : fade(amount, 0.92, 0.965);
      const left = lerp(ref.endpointX, ref.boxLeft, smoothstep(boxAmount));
      const right = lerp(ref.endpointX, ref.boxRight, smoothstep(boxAmount));
      setAttrs(ref.boxFill, {
        x: Math.min(left, right),
        y: ref.boxY,
        width: Math.max(0.1, Math.abs(right - left)),
        height: ref.boxHeight,
      });
      setOpacity(ref.boxFill, fade(boxAmount, 0.18, 0.78));
      setOpacity(ref.boxOutline, fade(boxAmount, 0.72, 1));
      const dataReview = 1;
      setOpacity(ref.interval, fade(amount, 0.975, 0.988) * dataReview);
      setOpacity(ref.colorDot, fade(amount, 0.988, 1) * dataReview);
      setOpacity(ref.colorText, fade(amount, 0.988, 1) * dataReview);
    });
  }

  setProgress(0);
  return {
    setProgress,
    keyboardStops: localKeyboardStops,
    trivalentStops: localTrivalentStops,
    trivalentRecords: localTrivalentRecords,
    phaseMarks,
  };
}

function setError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

function clearError() {
  errorBox.textContent = "";
  errorBox.hidden = true;
}

function writeInput(input) {
  rankInput.value = input.rank ?? "";
  rInput.value = input.r ?? "";
  uInput.value = input.u ?? "";
  rxwInput.value = input.rxw ?? "";
  lrInput.value = input.lr ?? "";
}

function inputFromForm() {
  return {
    family: "A",
    rank: rankInput.value,
    r: rInput.value,
    u: uInput.value,
    rxw: rxwInput.value,
    lr: lrInput.value,
  };
}

function paramsInput() {
  const params = new URLSearchParams(window.location.search);
  const out = {};
  ["rank", "r", "u", "rxw", "lr"].forEach((key) => {
    if (params.has(key)) out[key] = params.get(key);
  });
  if (params.has("n")) out.rank = params.get("n");
  return out;
}

function defaultInput() {
  return {
    rank: String(defaultExample.rank),
    r: String(defaultExample.r),
    u: defaultExample.u,
    rxw: defaultExample.rxw,
    lr: defaultExample.lr,
    ...paramsInput(),
  };
}

function syncLengthFromU() {
  try {
    const u = parseIntegerSequence(uInput.value, "i");
    if (u.length > 0) rInput.value = String(u.length);
  } catch {
    // Preserve the user's current input until Run is pressed.
  }
}

function sceneProgress() {
  if (forcedProgress !== null) return forcedProgress;
  const rect = film.getBoundingClientRect();
  const travel = Math.max(1, film.offsetHeight - window.innerHeight);
  return clamp((-rect.top / travel) * storyEnd, 0, storyEnd);
}

function renderFrame() {
  const delta = targetProgress - displayProgress;
  displayProgress += Math.abs(delta) < 0.001 ? delta : delta * 0.18;
  story?.setProgress(displayProgress);
  if (progressFill) progressFill.style.width = `${((displayProgress / storyEnd) * 100).toFixed(2)}%`;
  if (Math.abs(targetProgress - displayProgress) > 0.001) {
    rafId = window.requestAnimationFrame(renderFrame);
  } else {
    rafId = null;
  }
}

function requestRender() {
  if (keyboardAnimating || playbackPlaying) return;
  targetProgress = sceneProgress();
  if (rafId === null) rafId = window.requestAnimationFrame(renderFrame);
}

function setPlayButtonState() {
  if (!playButton) return;
  const icon = playButton.querySelector(".story-play-icon");
  const label = playButton.querySelector(".story-play-label");
  if (icon) icon.textContent = playbackPlaying ? "Ⅱ" : "▶";
  if (label) label.textContent = playbackPlaying ? "Pause" : "Play";
  playButton.setAttribute("aria-label", playbackPlaying ? "Pause animation" : "Play animation");
}

function resolvePlaybackWait() {
  if (!playbackWaitResolve) return;
  const resolve = playbackWaitResolve;
  playbackWaitResolve = null;
  resolve();
}

function prepareNarrationAudio() {
  narrationAudioElements.forEach((audio) => {
    audio.pause();
    audio.onended = null;
    audio.onerror = null;
    audio.removeAttribute("src");
    audio.load();
  });
  narrationAudioElements = [];
  narrationCues.forEach((cue) => {
    const stem = cue.audio.replace(/\.[^.]+$/, "");
    cue.audioSources = [
      `./audio/narration_openai/${stem}.mp3?v=${NARRATION_AUDIO_VERSION}`,
      `./audio/narration/${stem}.wav?v=${NARRATION_AUDIO_VERSION}`,
    ];
  });
  currentNarrationAudio = null;
  narrationAudioQueue = [];
}

function unlockNarrationAudio() {
  if (narrationAudioUnlocked) return;
  narrationAudioUnlocked = true;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const source = context.createBufferSource();
  source.buffer = context.createBuffer(1, 1, 22050);
  source.connect(context.destination);
  source.start(0);
  context.resume?.();
}

function cancelNarration() {
  narrationAudioRunId += 1;
  narrationAudioQueue = [];
  if (currentNarrationAudio) {
    currentNarrationAudio.onended = null;
    currentNarrationAudio.onerror = null;
    currentNarrationAudio.pause();
    currentNarrationAudio.currentTime = 0;
    currentNarrationAudio = null;
  }
  narrationAudioElements.forEach((audio) => {
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    audio.currentTime = 0;
  });
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
}

function resetNarration(progress = 0) {
  cancelNarration();
  narrationCueIndex = narrationCues.findIndex((cue) => cue.at > progress + 0.01);
  if (narrationCueIndex < 0) narrationCueIndex = narrationCues.length;
}

function fallbackSpeech(cue) {
  if (!("SpeechSynthesisUtterance" in window) || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(cue.text);
  utterance.lang = "en-US";
  utterance.rate = 0.82;
  utterance.pitch = 1;
  utterance.volume = 1;
  window.speechSynthesis.speak(utterance);
}

function fallbackSpeechBlocking(cue, runId, finish) {
  if (!("SpeechSynthesisUtterance" in window) || !("speechSynthesis" in window)) {
    finish();
    return;
  }
  const utterance = new SpeechSynthesisUtterance(cue.text);
  utterance.lang = "en-US";
  utterance.rate = 0.78;
  utterance.pitch = 1;
  utterance.volume = 1;
  utterance.onend = () => {
    if (runId === narrationAudioRunId) finish();
  };
  utterance.onerror = () => {
    if (runId === narrationAudioRunId) finish();
  };
  window.speechSynthesis.speak(utterance);
}

function makeNarrationAudio(src) {
  const audio = new Audio(src);
  audio.preload = "auto";
  audio.volume = 1;
  narrationAudioElements.push(audio);
  return audio;
}

function playCueNarrationAudio(cue, sourceIndex = 0, runId = narrationAudioRunId) {
  if (runId !== narrationAudioRunId || !playbackPlaying) return;
  const src = cue.audioSources?.[sourceIndex];
  if (!src) {
    fallbackSpeech(cue);
    window.setTimeout(playNextNarrationAudio, 450);
    return;
  }
  const audio = makeNarrationAudio(src);
  let settled = false;
  currentNarrationAudio = audio;
  currentNarrationAudio.currentTime = 0;

  const finish = (useNextSource) => {
    if (settled) return;
    settled = true;
    audio.onended = null;
    audio.onerror = null;
    audio.pause();
    if (currentNarrationAudio === audio) currentNarrationAudio = null;
    if (runId !== narrationAudioRunId || !playbackPlaying) return;
    if (useNextSource) {
      playCueNarrationAudio(cue, sourceIndex + 1, runId);
      return;
    }
    playNextNarrationAudio();
  };

  audio.onended = () => finish(false);
  audio.onerror = () => finish(true);
  audio.play().catch(() => finish(true));
}

function playNextNarrationAudio() {
  if (!playbackPlaying || currentNarrationAudio || narrationAudioQueue.length === 0) return;
  const cue = narrationAudioQueue.shift();
  playCueNarrationAudio(cue);
}

function speakNarration(cue) {
  narrationAudioQueue.push(cue);
  playNextNarrationAudio();
}

function playNarrationCueBlocking(cue, runId = playbackRunId) {
  return new Promise((resolve) => {
    if (!cue || !playbackPlaying || runId !== playbackRunId) {
      resolve();
      return;
    }
    let settled = false;
    let activeAudio = null;
    const finish = () => {
      if (settled) return;
      settled = true;
      if (activeAudio) {
        activeAudio.onended = null;
        activeAudio.onerror = null;
        activeAudio.pause();
      }
      if (currentNarrationAudio === activeAudio) currentNarrationAudio = null;
      if (playbackWaitResolve === finish) playbackWaitResolve = null;
      resolve();
    };
    playbackWaitResolve = finish;

    const trySource = (sourceIndex) => {
      if (settled || !playbackPlaying || runId !== playbackRunId) {
        finish();
        return;
      }
      const src = cue.audioSources?.[sourceIndex];
      if (!src) {
        fallbackSpeechBlocking(cue, narrationAudioRunId, finish);
        return;
      }
      const audio = makeNarrationAudio(src);
      activeAudio = audio;
      currentNarrationAudio = audio;
      audio.currentTime = 0;
      audio.onended = finish;
      audio.onerror = () => {
        if (settled) return;
        audio.onended = null;
        audio.onerror = null;
        audio.pause();
        if (currentNarrationAudio === audio) currentNarrationAudio = null;
        trySource(sourceIndex + 1);
      };
      audio.play().catch(() => {
        if (settled) return;
        audio.onerror();
      });
    };

    trySource(0);
  });
}

function updateNarration(progress) {
  if (!playbackPlaying) return;
  while (narrationCueIndex < narrationCues.length && progress >= narrationCues[narrationCueIndex].at) {
    speakNarration(narrationCues[narrationCueIndex]);
    narrationCueIndex += 1;
  }
}

function updateCaption(progress) {
  if (!captionBox) return;
  let activeCue = null;
  for (const cue of narrationCues) {
    if (cue.at <= progress + 0.001) activeCue = cue;
    else break;
  }
  captionBox.textContent = activeCue ? activeCue.text : "";
  captionBox.classList.toggle("is-final", activeCue === narrationCues[narrationCues.length - 1]);
}

function stopPlayback() {
  playbackRunId += 1;
  if (playbackRafId !== null) {
    window.cancelAnimationFrame(playbackRafId);
    playbackRafId = null;
  }
  playbackPlaying = false;
  cancelNarration();
  resolvePlaybackWait();
  setPlayButtonState();
}

function cancelCurrentPlaybackStep() {
  if (playbackRafId !== null) {
    window.cancelAnimationFrame(playbackRafId);
    playbackRafId = null;
  }
  cancelNarration();
  resolvePlaybackWait();
}

function animatePlaybackToProgress(nextProgress, runId) {
  return new Promise((resolve) => {
    if (forcedProgress !== null || !story || !playbackPlaying || runId !== playbackRunId) {
      resolve();
      return;
    }
    const target = clamp(nextProgress, 0, storyEnd);
    if (Math.abs(target - displayProgress) < 0.001) {
      resolve();
      return;
    }
    if (playbackRafId !== null) {
      window.cancelAnimationFrame(playbackRafId);
      playbackRafId = null;
    }
    const fromProgress = displayProgress;
    const fromScroll = window.scrollY;
    const toScroll = scrollTopForProgress(target);
    const distance = Math.abs(target - fromProgress);
    const duration = clamp(1200 + distance * 1100, 1200, 12000) * MOTION_SPEED_MULTIPLIER;
    const startedAt = window.performance.now();
    const finish = () => {
      if (playbackWaitResolve === finish) playbackWaitResolve = null;
      resolve();
    };
    playbackWaitResolve = finish;

    function tick(now) {
      if (!playbackPlaying || runId !== playbackRunId) {
        finish();
        return;
      }
      const amount = clamp((now - startedAt) / duration);
      const eased = smoothstep(amount);
      const currentProgress = lerp(fromProgress, target, eased);
      displayProgress = currentProgress;
      targetProgress = target;
      story.setProgress(currentProgress);
      if (progressFill) progressFill.style.width = `${((currentProgress / storyEnd) * 100).toFixed(2)}%`;
      window.scrollTo({ top: lerp(fromScroll, toScroll, eased), behavior: "auto" });

      if (amount < 1) {
        playbackRafId = window.requestAnimationFrame(tick);
        return;
      }
      displayProgress = target;
      targetProgress = target;
      story.setProgress(target);
      if (progressFill) progressFill.style.width = `${((target / storyEnd) * 100).toFixed(2)}%`;
      window.scrollTo({ top: toScroll, behavior: "auto" });
      playbackRafId = null;
      finish();
    }

    playbackRafId = window.requestAnimationFrame(tick);
  });
}

async function runPlaybackFromCueIndex(startIndex, runId) {
  const firstIndex = clamp(startIndex, 0, narrationCues.length);
  for (let idx = firstIndex; idx < narrationCues.length; idx += 1) {
    const cue = narrationCues[idx];
    if (!playbackPlaying || runId !== playbackRunId) return;
    if (Math.abs(cue.at - displayProgress) >= 0.001) {
      await animatePlaybackToProgress(cue.at, runId);
    }
    if (!playbackPlaying || runId !== playbackRunId) return;
    await playNarrationCueBlocking(cue, runId);
  }
  if (playbackPlaying && runId === playbackRunId) {
    await animatePlaybackToProgress(storyEnd, runId);
  }
  if (playbackPlaying && runId === playbackRunId) stopPlayback();
}

async function startPlayback() {
  if (forcedProgress !== null || !story) return;
  if (keyboardRafId !== null) {
    window.cancelAnimationFrame(keyboardRafId);
    keyboardRafId = null;
    keyboardAnimating = false;
  }
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  const runId = playbackRunId + 1;
  playbackRunId = runId;
  narrationAudioRunId += 1;
  const startProgress = displayProgress >= storyEnd - 0.02 ? 0 : displayProgress;
  playbackPlaying = true;
  targetProgress = startProgress;
  displayProgress = startProgress;
  story.setProgress(startProgress);
  if (progressFill) progressFill.style.width = `${((startProgress / storyEnd) * 100).toFixed(2)}%`;
  window.scrollTo({ top: scrollTopForProgress(startProgress), behavior: "auto" });
  setPlayButtonState();

  const startIndex = narrationCues.findIndex((cue) => cue.at >= startProgress - 0.01);
  await runPlaybackFromCueIndex(startIndex < 0 ? narrationCues.length : startIndex, runId);
}

function togglePlayback() {
  if (playbackPlaying) {
    stopPlayback();
    return;
  }
  unlockNarrationAudio();
  startPlayback();
}

function forcedProgressFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (!params.has("progress")) return null;
  const value = Number.parseFloat(params.get("progress") ?? "");
  return Number.isFinite(value) ? value : null;
}

function scrollTopForProgress(progress) {
  const travel = Math.max(1, film.offsetHeight - window.innerHeight);
  return film.offsetTop + (clamp(progress, 0, storyEnd) / storyEnd) * travel;
}

function playbackCueIndexInDirection(direction) {
  if (narrationCues.length === 0) return -1;
  const margin = 0.035;
  if (direction > 0) {
    const next = narrationCues.findIndex((cue) => cue.at > displayProgress + margin);
    return next < 0 ? narrationCues.length - 1 : next;
  }
  for (let idx = narrationCues.length - 1; idx >= 0; idx -= 1) {
    if (narrationCues[idx].at < displayProgress - margin) return idx;
  }
  return 0;
}

async function movePlaybackCue(direction) {
  if (!playbackPlaying || forcedProgress !== null || !story) return;
  const cueIndex = playbackCueIndexInDirection(direction);
  if (cueIndex < 0) return;
  playbackJumping = true;
  const runId = playbackRunId + 1;
  playbackRunId = runId;
  narrationAudioRunId += 1;
  cancelCurrentPlaybackStep();
  playbackPlaying = true;
  setPlayButtonState();
  playbackJumping = false;
  try {
    await runPlaybackFromCueIndex(cueIndex, runId);
  } finally {
    playbackJumping = false;
  }
}

function jumpToProgress(progress) {
  if (forcedProgress !== null || !story) return;
  stopPlayback();
  const nextProgress = clamp(progress, 0, storyEnd);
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
  targetProgress = nextProgress;
  displayProgress = nextProgress;
  story.setProgress(nextProgress);
  if (progressFill) progressFill.style.width = `${((nextProgress / storyEnd) * 100).toFixed(2)}%`;
  window.scrollTo({ top: scrollTopForProgress(nextProgress), behavior: "auto" });
}

function animateToProgress(progress) {
  if (forcedProgress !== null || !story) return;
  stopPlayback();
  const nextProgress = clamp(progress, 0, storyEnd);
  if (Math.abs(nextProgress - displayProgress) < 0.001) return;
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (keyboardRafId !== null) {
    window.cancelAnimationFrame(keyboardRafId);
    keyboardRafId = null;
  }
  const fromProgress = displayProgress;
  const fromScroll = window.scrollY;
  const toScroll = scrollTopForProgress(nextProgress);
  const distance = Math.abs(nextProgress - fromProgress);
  const duration = clamp(1100 + distance * 720, 1200, 5200) * MOTION_SPEED_MULTIPLIER;
  const startedAt = window.performance.now();
  keyboardAnimating = true;
  targetProgress = nextProgress;

  function tick(now) {
    const amount = clamp((now - startedAt) / duration);
    const eased = smoothstep(amount);
    const currentProgress = lerp(fromProgress, nextProgress, eased);
    displayProgress = currentProgress;
    story.setProgress(currentProgress);
    if (progressFill) progressFill.style.width = `${((currentProgress / storyEnd) * 100).toFixed(2)}%`;
    window.scrollTo({ top: lerp(fromScroll, toScroll, eased), behavior: "auto" });

    if (amount < 1) {
      keyboardRafId = window.requestAnimationFrame(tick);
      return;
    }
    displayProgress = nextProgress;
    targetProgress = nextProgress;
    story.setProgress(nextProgress);
    if (progressFill) progressFill.style.width = `${((nextProgress / storyEnd) * 100).toFixed(2)}%`;
    window.scrollTo({ top: toScroll, behavior: "auto" });
    keyboardAnimating = false;
    keyboardRafId = null;
    if (pendingKeyboardDirection !== 0) {
      const direction = pendingKeyboardDirection;
      pendingKeyboardDirection = 0;
      window.requestAnimationFrame(() => moveToKeyboardStop(direction));
    }
  }

  keyboardRafId = window.requestAnimationFrame(tick);
}

function moveToKeyboardStop(direction) {
  if (keyboardStops.length === 0) return;
  if (keyboardAnimating) {
    pendingKeyboardDirection = direction;
    return;
  }
  const current = keyboardAnimating ? targetProgress : displayProgress;
  const margin = 0.04;
  const next = direction > 0
    ? keyboardStops.find((stop) => stop > current + margin)
    : [...keyboardStops].reverse().find((stop) => stop < current - margin);
  animateToProgress(next ?? (direction > 0 ? storyEnd : 0));
}

function setEmbeddedProgress(progress) {
  if (!story) return;
  stopPlayback();
  const nextProgress = clamp(progress, 0, storyEnd);
  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
  if (keyboardRafId !== null) {
    window.cancelAnimationFrame(keyboardRafId);
    keyboardRafId = null;
  }
  targetProgress = nextProgress;
  displayProgress = nextProgress;
  story.setProgress(nextProgress);
  if (progressFill) progressFill.style.width = `${((nextProgress / storyEnd) * 100).toFixed(2)}%`;
}

function setEmbeddedPhaseProgress(amount) {
  if (!story) return;
  const marks = story.phaseMarks ?? {};
  const start = Number.isFinite(marks.handoffStart) ? marks.handoffStart : 0;
  const end = Number.isFinite(marks.finalEnd) ? marks.finalEnd : storyEnd;
  setEmbeddedProgress(lerp(start, end, clamp(amount)));
}

function exposeEmbeddedApi() {
  if (!story) return;
  window.storyModeApi = {
    get storyEnd() {
      return storyEnd;
    },
    get keyboardStops() {
      return keyboardStops.slice();
    },
    get trivalentStops() {
      return trivalentStops.slice();
    },
    get trivalentRecords() {
      return trivalentRecords.map((record) => ({ ...record }));
    },
    get phaseMarks() {
      return { ...(story.phaseMarks ?? {}) };
    },
    setProgress: setEmbeddedProgress,
    setPhaseProgress: setEmbeddedPhaseProgress,
  };
  const pendingPhase = Number(window.STORY_MODE_PHASE);
  if (Number.isFinite(pendingPhase)) {
    window.storyModeApi.setPhaseProgress(pendingPhase);
  }
  if (window.parent && window.parent !== window) {
    window.parent.postMessage({
      type: "story-mode-ready",
      storyEnd,
      keyboardStops,
      trivalentStops,
      trivalentRecords,
      phaseMarks: story.phaseMarks ?? {},
    }, "*");
  }
  window.dispatchEvent(new CustomEvent("story-mode-ready", {
    detail: {
      storyEnd,
      keyboardStops,
      trivalentStops,
      trivalentRecords,
      phaseMarks: story.phaseMarks ?? {},
    },
  }));
}

function shouldIgnoreKeyboard(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;
  return target.closest("input, textarea, select, button, [contenteditable='true']") !== null;
}

function runConstruction({ scrollToFilm = false } = {}) {
  try {
    stopPlayback();
    clearError();
    syncLengthFromU();
    trace = buildTrace(inputFromForm());
    rInput.value = String(trace.u.length);
    story = renderStory(trace);
    keyboardStops = story.keyboardStops ?? [];
    trivalentStops = story.trivalentStops ?? [];
    trivalentRecords = story.trivalentRecords ?? [];
    const nextProgress = forcedProgress === null ? 0 : clamp(forcedProgress, 0, storyEnd);
    displayProgress = nextProgress;
    targetProgress = nextProgress;
    story.setProgress(nextProgress);
    if (progressFill) progressFill.style.width = `${((nextProgress / storyEnd) * 100).toFixed(2)}%`;
    setPlayButtonState();
    if (scrollToFilm && forcedProgress === null) {
      window.scrollTo({ top: film.offsetTop, behavior: "auto" });
      requestRender();
    }
    exposeEmbeddedApi();
  } catch (error) {
    setError(error.message);
    svg.replaceChildren(svgEl("text", { class: "story-error", x: 720, y: 430 }, error.message));
  }
}

writeInput(defaultInput());
syncLengthFromU();
forcedProgress = forcedProgressFromUrl();
if (pageParams.get("capture") === "1") {
  document.body.classList.add("story-capture");
}
if (pageParams.get("embed") === "1") {
  document.body.classList.add("story-embed");
}
runConstruction();

window.addEventListener("message", (event) => {
  const data = event.data ?? {};
  if (data.type === "set-story-progress") {
    setEmbeddedProgress(Number(data.progress));
  }
  if (data.type === "set-story-phase-progress") {
    setEmbeddedPhaseProgress(Number(data.progress));
  }
});

if (forcedProgress === null && !embedMode) {
  requestRender();
  window.addEventListener("scroll", requestRender, { passive: true });
  window.addEventListener("resize", requestRender);
  window.addEventListener("keydown", (event) => {
    if (shouldIgnoreKeyboard(event)) return;
    if (event.repeat) return;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") {
      event.preventDefault();
      if (playbackPlaying) movePlaybackCue(1);
      else moveToKeyboardStop(1);
    } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
      event.preventDefault();
      if (playbackPlaying) movePlaybackCue(-1);
      else moveToKeyboardStop(-1);
    }
  });
}

playButton?.addEventListener("click", togglePlayback);
setPlayButtonState();

uInput.addEventListener("input", syncLengthFromU);

randomButton.addEventListener("click", () => {
  try {
    clearError();
    writeInput(randomExample({
      family: "A",
      rank: rankInput.value,
      r: rInput.value,
    }));
    runConstruction({ scrollToFilm: true });
  } catch (error) {
    setError(error.message);
  }
});

rankInput.addEventListener("change", () => {
  try {
    const rank = Number.parseInt(rankInput.value, 10);
    if (Number.isInteger(rank) && rank > 0 && rxwInput.value.trim() === "") {
      rxwInput.value = standardHalfTwistWord(rank, "A").join(" ");
    }
  } catch (error) {
    setError(error.message);
  }
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  runConstruction({ scrollToFilm: true });
});


})();
