// src/types/zxcvbn.d.ts
declare module 'zxcvbn' {
  interface ZXCVBNResult {
    score: number;              // 0–4
    feedback: {
      warning: string;
      suggestions: string[];
    };
    guesses: number;
    guesses_log10: number;
    sequence: any[];
    calc_time: number;
    crack_times_seconds: {
      [scenario: string]: number;
    };
    crack_times_display: {
      [scenario: string]: string;
    };
  }

  function zxcvbn(password: string): ZXCVBNResult;

  export = zxcvbn;
}
