import json

with open('server/db/data/expenses.json', encoding='utf-8') as f:
    data = json.load(f)

txns = data['transactions']
recent = [t for t in txns if t['date'] >= '2025-05']
housing = [t for t in recent if t['mappedCategory'] == 'housing' and t['transactionType'] == 'expense']
total = sum(t['amount'] for t in housing)
months = len(set(t['date'][:7] for t in recent))
print(f"Housing May 2025+: {len(housing)} txns, total=${total:,.0f}, months={months}, avg=${total/months:,.0f}/mo")

penny = [t for t in housing if 'pennymac' in t['description'].lower()]
print(f"PennyMac txns: {len(penny)}")
for t in penny:
    print(f"  {t['date']} | ${t['amount']:,.2f}")

wf = [t for t in recent if 'wells fargo auto' in t['description'].lower()]
print(f"\nWells Fargo Auto (now transportation): {len(wf)} txns")
for t in wf:
    print(f"  {t['date']} | ${t['amount']:,.2f} | {t['mappedCategory']}")
