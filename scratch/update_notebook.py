import json

file_path = r'c:\Final year project\SafeSign\model\siamese_final_Sig260.ipynb'

with open(file_path, 'r', encoding='utf-8') as f:
    nb = json.load(f)

for cell in nb.get('cells', []):
    if cell.get('cell_type') == 'code':
        source = cell.get('source', [])
        for i, line in enumerate(source):
            if 'drive.mount' in line or 'google.colab' in line:
                source[i] = '# ' + line
            elif '/content/drive/MyDrive/D_Drive/Datasets/BHSig260-Bengali/BHSig260-Bengali' in line:
                source[i] = line.replace("'/content/drive/MyDrive/D_Drive/Datasets/BHSig260-Bengali/BHSig260-Bengali'", r"r'c:\Final year project\SafeSign\dataset\BHSig260-Bengali'")
            elif '/content/drive/MyDrive/D_Drive/Datasets/CEDAR/CEDAR' in line:
                source[i] = line.replace("'/content/drive/MyDrive/D_Drive/Datasets/CEDAR/CEDAR'", r"r'c:\Final year project\SafeSign\dataset\CEDAR'")
            elif '/content/drive/MyDrive/D_Drive/Datasets/BHSig260-Hindi/BHSig260-Hindi' in line:
                source[i] = line.replace("'/content/drive/MyDrive/D_Drive/Datasets/BHSig260-Hindi/BHSig260-Hindi'", r"r'c:\Final year project\SafeSign\dataset\BHSig260-Hindi'")

with open(file_path, 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=2)
print("Notebook updated successfully.")
