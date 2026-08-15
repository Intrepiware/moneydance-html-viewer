import json
import time
import os
# from com.infinitekind.moneydance.model import Account
from com.infinitekind.moneydance.model import AbstractTxn

def get_status_str(status):
    if status == AbstractTxn.ClearedStatus.CLEARED: 
        return "CLEARED"
    if status == AbstractTxn.ClearedStatus.RECONCILING: 
        return "RECONCILING"
    return "UNCLEARED"

def format_amount(val, currency):
    if not currency: 
        return val / 100.0
    return currency.getDoubleValue(val)

book = moneydance.getCurrentAccountBook()
root = book.getRootAccount()

def build_account_tree(acct):
    node = {
        "id": unicode(acct.getUUID()),
        "name": unicode(acct.getAccountName()),
        "type": unicode(acct.getAccountType().name()),
        "currency": unicode(acct.getCurrencyType().getIDString()),
        "children": []
    }
    for i in range(acct.getSubAccountCount()):
        child = acct.getSubAccount(i)
        node["children"].append(build_account_tree(child))
    return node

account_tree = build_account_tree(root)

txns = []
for ptxn in book.getTransactionSet().getAllTxns():
    parent_acct = ptxn.getAccount()
    currency = parent_acct.getCurrencyType()
    
    tags = []
    keywords = ptxn.getKeywords()
    if keywords:
        tags = [unicode(k) for k in keywords]
        
    splits = []
    for i in range(ptxn.getOtherTxnCount()):
        stxn = ptxn.getOtherTxn(i)
        splits.append({
            "category_id": unicode(stxn.getAccount().getUUID()),
            "category_name": unicode(stxn.getAccount().getAccountName()),
            "amount": format_amount(stxn.getValue(), currency),
            # "memo": unicode(stxn.getMemo()) if stxn.getMemo() else "",
            "memo": unicode(stxn.getMemo()) if "getMemo" in dir(stxn) else "",
            "cleared_status": get_status_str(stxn.getStatus())
        })
        
    txns.append({
        "id": unicode(ptxn.getUUID()),
        "date": ptxn.getDateInt(),
        "account_id": unicode(parent_acct.getUUID()),
        "account_name": unicode(parent_acct.getAccountName()),
        "check_num": unicode(ptxn.getCheckNumber()) if ptxn.getCheckNumber() else "",
        "description": unicode(ptxn.getDescription()) if ptxn.getDescription() else "",
        # "memo": unicode(ptxn.getMemo()) if ptxn.getMemo() else "",
        "memo": unicode(ptxn.getMemo()) if "getMemo" in dir(ptxn) else "",
        "cleared_status": get_status_str(ptxn.getStatus()),
        "tags": tags,
        "splits": splits
    })

output_data = {
    "accounts": account_tree,
    "transactions": txns
}

timestamp = time.strftime("%Y%m%d-%H%M%S")
filepath = r"C:\data\json\moneydance-export-%s.json" % timestamp

dir_name = os.path.dirname(filepath)
if not os.path.exists(dir_name):
    os.makedirs(dir_name)

with open(filepath, 'w') as f:
    json.dump(output_data, f, indent=2)

print("Export saved to: " + filepath)