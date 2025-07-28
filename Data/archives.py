import pandas as pd
import os
import re

# --- CONFIGURAÇÃO ---
# !!! IMPORTANTE !!!
# Substitua o caminho abaixo pelo caminho COMPLETO da pasta onde estão os seus 117 arquivos Excel.
# Exemplo Windows: "C:\\Users\\SeuUsuario\\Desktop\\DadosPoliciais"
# Exemplo Mac/Linux: "/Users/SeuUsuario/Desktop/DadosPoliciais"
caminho_da_pasta = "/content/dados por delegacia"

# Nome do arquivo de saída que será gerado
arquivo_de_saida = "dados_criminais_consolidados.csv"

# --- LÓGICA DO SCRIPT ---

# Lista para armazenar os dados de todas as planilhas
lista_de_dataframes = []

print(f"Iniciando a leitura dos arquivos na pasta: {caminho_da_pasta}")

# Verifica se o caminho da pasta existe
if not os.path.isdir(caminho_da_pasta):
    print(f"ERRO: O caminho especificado não é uma pasta válida: {caminho_da_pasta}")
else:
    # Loop por todos os arquivos na pasta especificada
    for nome_do_arquivo in os.listdir(caminho_da_pasta):

        # Processar apenas se for um arquivo Excel
        if nome_do_arquivo.endswith('.xlsx'):
            caminho_completo = os.path.join(caminho_da_pasta, nome_do_arquivo)
            print(f"Processando arquivo: {nome_do_arquivo}...")

            try:
                # Extrai o nome da Delegacia do nome do arquivo
                # Ex: "OcorrenciaMensal(Criminal)-001 DP - Sé_20250724_220600.xlsx" -> "001 DP - Sé"
                match = re.search(r'-(.*? DP - .*?)_', nome_do_arquivo)
                if match:
                    nome_dp = match.group(1).strip()
                else:
                    # Caso não encontre o padrão, usa o nome do arquivo como fallback
                    nome_dp = nome_do_arquivo.split('.')[0]

                # Abre o arquivo Excel para ler suas planilhas
                xls = pd.ExcelFile(caminho_completo)

                # Loop por todas as planilhas (anos) dentro do arquivo Excel
                for nome_da_planilha in xls.sheet_names:
                    # Lê a planilha atual para um DataFrame
                    df = pd.read_excel(xls, sheet_name=nome_da_planilha)

                    # Adiciona as colunas de contexto
                    df['Ano'] = nome_da_planilha
                    df['Delegacia'] = nome_dp

                    # Adiciona o dataframe processado à nossa lista
                    lista_de_dataframes.append(df)

            except Exception as e:
                print(f"  -> Erro ao processar o arquivo '{nome_do_arquivo}': {e}")

    # Verifica se algum dado foi lido
    if not lista_de_dataframes:
        print("Nenhum dado foi lido. Verifique se a pasta contém arquivos .xlsx válidos.")
    else:
        # Concatena todos os dataframes da lista em um único dataframe
        print("\nConsolidando todos os dados...")
        df_final = pd.concat(lista_de_dataframes, ignore_index=True)

        # Reorganiza as colunas para ter as de contexto primeiro
        colunas_iniciais = ['Delegacia', 'Ano', 'Natureza']
        colunas_restantes = [col for col in df_final.columns if col not in colunas_iniciais]
        df_final = df_final[colunas_iniciais + colunas_restantes]

        # Limpeza dos dados numéricos (remove pontos de milhar e converte para número)
        for mes in ['Janeiro', 'Fevereiro', 'Marco', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro', 'Total']:
            if mes in df_final.columns:
                # Converte a coluna para string para poder usar o .str
                df_final[mes] = df_final[mes].astype(str)
                # Remove pontos que são usados como separador de milhar
                df_final[mes] = df_final[mes].str.replace('.', '', regex=False)
                # Converte para numérico. Erros (como '...') viram 'NaN' (Not a Number)
                df_final[mes] = pd.to_numeric(df_final[mes], errors='coerce')

        # Salva o dataframe consolidado em um arquivo CSV
        df_final.to_csv(arquivo_de_saida, index=False, encoding='utf-8-sig')

        print(f"\nProcesso concluído com sucesso!")
        print(f"Arquivo consolidado salvo como: '{arquivo_de_saida}'")
