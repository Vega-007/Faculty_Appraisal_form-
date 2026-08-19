import re
import random

def main():
    file_path = 'src/lib/mockSeedData.ts'
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to find the blocks for each appraisal in SEED_APPRAISALS.
    # The scores and grade are at the end of each object:
    # "selfScoreTotal": 230,
    # "hodScoreTotal": 230,
    # "hoiScoreTotal": 230,
    # "grade": "Grade C",
    
    # We want 20% A, 50% B, 30% C out of 418 records.
    total = 418
    num_a = 84
    num_b = 209
    num_c = 125

    grades = ['A'] * num_a + ['B'] * num_b + ['C'] * num_c
    random.seed(42)
    random.shuffle(grades)
    
    # We can match the pattern:
    # "selfScoreTotal": \d+,
    #\s*"hodScoreTotal": \d+,
    #\s*"hoiScoreTotal": \d+,
    #\s*"grade": "Grade [ABC]",
    
    pattern = re.compile(
        r'("selfScoreTotal":\s*)\d+(,\s*"hodScoreTotal":\s*)\d+(,\s*"hoiScoreTotal":\s*)\d+(,\s*"grade":\s*"Grade )[ABC](")',
        re.DOTALL
    )
    
    def replacer(match):
        nonlocal grades
        if not grades:
            g = 'C'
        else:
            g = grades.pop(0)
            
        if g == 'A':
            score = 320
        elif g == 'B':
            score = 280
        else:
            score = 160
            
        return f'{match.group(1)}{score}{match.group(2)}{score}{match.group(3)}{score}{match.group(4)}{g}{match.group(5)}'

    new_content, count = pattern.subn(replacer, content)
    print(f'Replaced {count} occurrences.')
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)

if __name__ == '__main__':
    main()
