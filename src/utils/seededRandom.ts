// M11: Web Application - Seeded Random Number Generator
// TypeScript port from Rust implementation

/**
 * Seeded random number generator using Xorshift algorithm
 * Ensures deterministic prompt generation - same seed always produces same sequence
 */
export class SeededRandom {
  private state: bigint;

  constructor(seed: number) {
    // Convert seed to BigInt, avoid 0
    this.state = seed === 0 ? 1n : BigInt(seed);

    // Warm up the RNG - discard first 10 values
    // Xorshift can produce poor initial values
    for (let i = 0; i < 10; i++) {
      this.nextU64();
    }
  }

  /**
   * Generate next random u64 using Xorshift64
   */
  private nextU64(): bigint {
    this.state ^= this.state << 13n;
    this.state ^= this.state >> 7n;
    this.state ^= this.state << 17n;

    // Keep it within 64-bit range
    this.state = this.state & 0xffffffffffffffffn;

    return this.state;
  }

  /**
   * Generate random usize in range [0, max) (exclusive max)
   */
  nextUsize(max: number): number {
    if (max === 0) return 0;

    const value = this.nextU64();
    return Number(value % BigInt(max));
  }

  /**
   * Generate random f32 in range [0.0, 1.0)
   */
  nextF32(): number {
    const value = this.nextU64();
    const scaled = Number(value >> 11n); // Use 53 bits
    return scaled / 9007199254740992.0; // 2^53
  }

  /**
   * Generate random value in range [min, max] (inclusive)
   */
  genRange(min: number, max: number): number {
    if (min > max) {
      throw new Error('min must be <= max');
    }

    if (min === max) return min;

    const rangeSize = BigInt(max - min + 1);
    const value = this.nextU64() % rangeSize;
    return min + Number(value);
  }

  /**
   * Select random index from weighted items
   * Weights are normalized internally
   */
  weightedChoice(weights: number[]): number {
    if (weights.length === 0) {
      throw new Error('Cannot choose from empty weights');
    }

    if (weights.length === 1) return 0;

    // Calculate total weight
    const total = weights.reduce((sum, w) => sum + w, 0);

    if (total <= 0) {
      // All weights are 0 or negative, choose uniformly
      return this.nextUsize(weights.length);
    }

    // Generate random value in [0, total)
    let target = this.nextF32() * total;

    // Find the weighted index
    for (let i = 0; i < weights.length; i++) {
      const weight = weights[i];
      if (weight === undefined) continue;
      target -= weight;
      if (target <= 0) {
        return i;
      }
    }

    // Fallback (shouldn't happen due to floating point precision)
    return weights.length - 1;
  }
}
