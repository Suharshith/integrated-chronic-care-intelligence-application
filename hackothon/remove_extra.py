import os
import re

symbols = [
    '⚠', '✅', '⭐', '●', '→', '←', '🚀', '🏥', '🧬', '📊', 
    '⏰', '🦋', '🫁', '🩸', '🧠', '🫘', '🫀', '🛡️', '🚪', '📋', 
    '📍', '🥗', '🤖', '👥', '💓', '📎', '🔍', '⚙️', '⏳', '🤍', '🧑‍⚕️', '👨‍⚕️', '💉', '⚕️', '💊', '✨', '⚡', '💪', '🩺'
]

def clean_file(path):
    for root, dirs, files in os.walk(path):
        if '.git' in root or 'node_modules' in root or '.next' in root:
            continue
        for f in files:
            if f.endswith(('.js', '.jsx', '.ts', '.tsx', '.py', '.css')):
                file_path = os.path.join(root, f)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f_in:
                        text = f_in.read()
                    
                    orig_text = text
                    for sym in symbols:
                        text = text.replace(sym, '')
                    
                    # A more general approach to remove any character in the emoji unicode ranges
                    # using regular expressions
                    emoji_pattern = re.compile(
                        r'['
                        r'\U0001F600-\U0001F64F'  # emoticons
                        r'\U0001F300-\U0001F5FF'  # symbols & pictographs
                        r'\U0001F680-\U0001F6FF'  # transport & map symbols
                        r'\U0001F1E0-\U0001F1FF'  # flags (iOS)
                        r'\U00002702-\U000027B0'
                        r'\U000024C2-\U0001F251'
                        r'\U0001F900-\U0001F9FF'  # supplemental symbols and pictographs
                        r'\U0001FA70-\U0001FAFF'  # symbols and pictographs extended-a
                        r'\u2600-\u26ff'          # miscellaneous symbols
                        r'\u2700-\u27bf'          # dingbats
                        r']+', flags=re.UNICODE)
                    
                    text = emoji_pattern.sub(r'', text)

                    if text != orig_text:
                        with open(file_path, 'w', encoding='utf-8') as f_out:
                            f_out.write(text)
                        print(f'Cleaned extra symbols from {file_path}')
                except Exception as e:
                    pass

clean_file('c:/Users/suhar/OneDrive/Desktop/hackothon/frontend/src')
clean_file('c:/Users/suhar/OneDrive/Desktop/hackothon/backend')
