from util_fucntions import util_functions
import requests

OG_BRAND_NAME_FILE = '/Users/naga/Downloads/Book14.xlsx'
NON_DUPL_BRAND_NAME_FILE = '/Users/naga/Downloads/Book14.xlsx'


def main():
    non_dupl_brand_names = sorted(util_functions.remove_duplicate_in_list(
        [data['name'] for data in util_functions.read_excel_file(format_key=True, path=OG_BRAND_NAME_FILE)]))
    '''util_functions.save_dict_to_excel_workbook_with_row_formatting(file_path=NON_DUPL_BRAND_NAME_FILE,
                                                                   headers=['Name'],
                                                                   rows=[[data] for data in non_dupl_brand_names])'''


if __name__ == '__main__':
    main()
