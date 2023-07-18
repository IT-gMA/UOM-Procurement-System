from util_fucntions import util_functions
import requests
import numpy as np
import pandas as pd
from tqdm import tqdm
from operator import itemgetter

PRODUCT_FILE_PATH = '../dataset/prg_uomprocurementserviceproducts.xlsx'
VENDOR_FILE_PATH = '../dataset/prg_uomprocurementvendors.xlsx'
RAW_MAPPING_PATH = '../dataset/Product_vendor_Map.xlsx'
SAVED_FILE_PATH = '../dataset/new_product_vendor_map.xlsx'
HEADERS = ['Code', 'Old Product Name', 'New Product Name', 'Product UID', 'Vendor', 'Vendor UID', 'Price', 'Stock On Hand', 'Stock Orderd', 'Stock in Transit', 'is_active']


def read_payload(request):
    # Assuming 'request' is the incoming POST request object
    try:
        payload = request.json()  # Read the JSON payload data
        # If the request body is in another format like form-data or url-encoded,
        # you can use 'request.form' or 'request.data' accordingly
        return payload
    except ValueError:
        return None


def _format_uom_payload(payload: dict) -> tuple:
    return [
        {'product_name': data['prg_name'],
         'product_uid': data['prg_uomprocurementserviceproductsid'],
         'length': len(data['prg_name'])
         } for data in payload['products']
    ], [
        {
            'vendor_name': data['prg_name'],
            'vendor_uid': data['prg_uomprocurementvendorid'],
            'length': len(data['prg_name'])
        } for data in payload['vendors']
    ]


def map_to_dataverse_uids(raw_mappings: list, vendors: list, products: list) -> list:
    new_mappings = []
    curr_vendor = None
    corresponding_vendor = None
    print('Filling NaN vendors')
    for i in tqdm(range(len(raw_mappings))):
        if not pd.isna(raw_mappings[i]['vendor']):
            curr_vendor = raw_mappings[i]['vendor']
            corresponding_vendor = [vendor for vendor in vendors if
                                    util_functions.lower_case_and_clear_white_space(curr_vendor,
                                                                                    to_regex=True) == util_functions.lower_case_and_clear_white_space(
                                        vendor['vendor_name'])][0]
        elif corresponding_vendor is None:
            continue

        #print(raw_mappings[i]['product'])
        corresponding_product = [product for product in products if util_functions.are_strings_similar(raw_mappings[i]['product'], product['product_name'])]
        if len(corresponding_product) > 1 and not util_functions.are_strings_the_same(raw_mappings[i]['product'], corresponding_product[0]['product_name']):
            print(f"{raw_mappings[i]['product']}::{len(corresponding_product)}\tfirst choice is {corresponding_product[0]['product_name']}")
        elif len(corresponding_product) < 1:
            print(f"{raw_mappings[i]['product']}")
        corresponding_product = corresponding_product[0]
        new_mappings.append({
            'code': raw_mappings[i]['code'],
            'product': raw_mappings[i]['product'],
            'dv_product': corresponding_product['product_name'],
            'product_uid': corresponding_product['product_uid'],
            'vendor': corresponding_vendor['vendor_name'],
            'vendor_uid': corresponding_vendor['vendor_uid'],
            'price': raw_mappings[i]['price']
        })

    return new_mappings


def main():
    raw_mappings = util_functions.read_excel_file(path=RAW_MAPPING_PATH, format_key=True)
    if pd.isna(raw_mappings[2]['vendor']):
        print(raw_mappings[2])

    response = requests.post(
        'https://prod-31.australiasoutheast.logic.azure.com:443/workflows/8b285d16b71e4f4d8836cb7707e137e9/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=0yk5918p1FfmxKZ42a5nJ_wjmbZtSrOnDNxlgHXk44M')
    if response.status_code == 200:
        payload = read_payload(response)
        if payload is not None:
            products, vendors = _format_uom_payload(payload)
            products = sorted(products, key=itemgetter('length'), reverse=True)
            vendors = sorted(vendors, key=itemgetter('length'), reverse=True)

            raw_mappings = map_to_dataverse_uids(raw_mappings, vendors, products)

            util_functions.save_dict_to_excel_workbook_with_row_formatting(file_path=SAVED_FILE_PATH,
                                                                           headers=HEADERS,
                                                                           rows=[
                                                                               [data['code'], data['product'], data['dv_product'], data['product_uid'], data['vendor'], data['vendor_uid'], data['price'], 1000, 0, 0, True]
                                                                               for data in raw_mappings
                                                                           ])
        else:
            print("Invalid payload format.")
    else:
        print("Request failed with status code:", response.status_code)


if __name__ == '__main__':
    main()
