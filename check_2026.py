import csv

with open(r'C:\Users\stema\Downloads\2026-05-02T17_53_19.217Z-transactions.csv', encoding='utf-8') as f:
    rows = list(csv.DictReader(f))

txns_2026 = [r for r in rows if r['Date'] >= '2026-01']
print('Total 2026 txns:', len(txns_2026))

# Large payments > $1000
large = [r for r in txns_2026 if float(r['Amount']) > 1000]
print('\n2026 transactions > $1000:')
for r in sorted(large, key=lambda x: -float(x['Amount'])):
    print(f"  {r['Date']} | ${float(r['Amount']):>10,.2f} | {r['Category']:20s} | {r['Name'][:60]}")

# Loan Payment category in 2026
print('\nLoan Payment in 2026:')
loans_2026 = [r for r in txns_2026 if r['Category'] == 'Loan Payment']
print(f"  Count: {len(loans_2026)}")
for r in loans_2026:
    print(f"  {r['Date']} | ${float(r['Amount']):>8,.2f} | {r['Name'][:60]}")

# Bills & Utilities > $500 in 2026
print('\nBills & Utilities > $500 in 2026:')
bills = [r for r in txns_2026 if r['Category'] == 'Bills & Utilities' and float(r['Amount']) > 500]
for r in bills:
    print(f"  {r['Date']} | ${float(r['Amount']):>8,.2f} | {r['Name'][:60]}")

# Dec 2025 — look for refinance
print('\nDec 2025 large transactions (> $1000):')
dec = [r for r in rows if r['Date'].startswith('2025-12') and float(r['Amount']) > 1000]
for r in sorted(dec, key=lambda x: -float(x['Amount'])):
    print(f"  {r['Date']} | ${float(r['Amount']):>10,.2f} | {r['Category']:20s} | {r['Name'][:60]}")
