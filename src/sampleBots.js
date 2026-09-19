export const sampleBots = [
  {
    name: 'Rise Fall Pulse',
    description: 'A simple rise/fall sample that follows the latest tick direction.',
    market: 'R_100',
    tradeType: 'Rise / Fall',
    contract: '5 ticks',
    script: 'ON_TICK\n  IF current_price > previous_price\n    SIGNAL Rise\n  ELSE IF current_price < previous_price\n    SIGNAL Fall\n  END IF\nEND',
  },
  {
    name: 'Digits Over Five',
    description: 'A digits-over sample strategy using the last tick digit.',
    market: 'R_75',
    tradeType: 'Digits',
    contract: 'Over 5',
    script: 'ON_TICK\n  last_digit = LAST_DIGIT(current_price)\n  IF last_digit > 5\n    SIGNAL Over\n  END IF\nEND',
  },
  {
    name: 'Accumulator Growth',
    description: 'A conservative accumulator sample with a bounded growth target.',
    market: 'R_50',
    tradeType: 'Accumulators',
    contract: 'Growth 2%',
    script: 'ON_TICK\n  growth_rate = 2%\n  IF barrier_is_clear AND volatility_is_stable\n    SIGNAL Up\n  ELSE\n    WAIT\n  END IF\nEND',
  },
  {
    name: 'Even Odd Checker',
    description: 'An even/odd sample strategy based on the last market digit.',
    market: '1HZ10V',
    tradeType: 'Even / Odd',
    contract: '3 ticks',
    script: 'ON_TICK\n  last_digit = LAST_DIGIT(current_price)\n  IF last_digit % 2 == 0\n    SIGNAL Even\n  ELSE\n    SIGNAL Odd\n  END IF\nEND',
  },
];
