import ast
import os
import re

def process_file(filepath, methods_to_remove, rewrite_func, new_file):
    with open(filepath, "r", encoding="utf-8") as f:
        lines = f.readlines()
        
    with open(filepath, "r", encoding="utf-8") as f:
        tree = ast.parse(f.read())
        
    extracted = []
    remove_ranges = []
    
    for node in tree.body:
        if isinstance(node, ast.ClassDef):
            for item in node.body:
                if isinstance(item, (ast.FunctionDef, ast.AsyncFunctionDef)):
                    if item.name in methods_to_remove:
                        # get exact lines, considering decorators
                        start_line = item.decorator_list[0].lineno if item.decorator_list else item.lineno
                        end_line = item.end_lineno
                        remove_ranges.append((start_line - 1, end_line))
                        
                        source = "".join(lines[start_line - 1 : end_line])
                        extracted.append(rewrite_func(source))

    # Remove the lines in reverse order to not mess up indices
    remove_ranges.sort(reverse=True)
    for start, end in remove_ranges:
        del lines[start:end]
        
    # Remove empty lines left behind at the end of the class
    while lines and lines[-1].strip() == "":
        lines.pop()

    with open(filepath, "w", encoding="utf-8") as f:
        f.writelines(lines)
        
    with open(new_file, "a", encoding="utf-8") as f:
        f.write("\n\n" + "\n".join(extracted))

def rewrite_whisper(source):
    # Remove @staticmethod
    source = re.sub(r"^\s*@staticmethod\s*\n", "", source, flags=re.MULTILINE)
    
    source = source.replace("def generate_srt(\n        self,\n", "def generate_srt(\n        engine,\n")
    source = source.replace("def generate_vtt(\n        self,\n", "def generate_vtt(\n        engine,\n")
    source = source.replace("def extract_words_with_timestamps(\n        self,\n", "def extract_words_with_timestamps(\n        engine,\n")
    source = source.replace("def generate_json_transcript(\n        self,\n", "def generate_json_transcript(\n        engine,\n")
    source = source.replace("def batch_transcribe(\n        self,\n", "def batch_transcribe(\n        engine,\n")
    
    source = source.replace("self.transcribe(", "engine.transcribe(")
    source = source.replace("self._format_srt_time(", "_format_srt_time(")
    source = source.replace("self._format_vtt_time(", "_format_vtt_time(")
    
    # unindent
    lines = source.split("\n")
    return "\n".join([line[4:] if line.startswith("    ") else line for line in lines])

def rewrite_librosa(source):
    source = source.replace("def detect_silence(\n        self,\n", "def detect_silence(\n        engine,\n")
    source = source.replace("def segment_by_energy(\n        self,\n", "def segment_by_energy(\n        engine,\n")
    source = source.replace("def extract_summary_stats(self,", "def extract_summary_stats(engine,")
    source = source.replace("def save_audio_segment(\n        self,\n", "def save_audio_segment(\n        engine,\n")
    
    source = source.replace("self.load_audio(", "engine.load_audio(")
    source = source.replace("self._compute_energy", "engine._compute_energy")
    source = source.replace("self.hop_length", "engine.hop_length")
    source = source.replace("self.extract_all_features(", "engine.extract_all_features(")
    
    # unindent
    lines = source.split("\n")
    return "\n".join([line[4:] if line.startswith("    ") else line for line in lines])

whisper_methods = [
    "generate_srt", "generate_vtt", "extract_words_with_timestamps", 
    "generate_json_transcript", "batch_transcribe", "_format_srt_time", "_format_vtt_time"
]

librosa_methods = [
    "detect_silence", "segment_by_energy", "extract_summary_stats", "save_audio_segment"
]

audio_path = "C:/Users/dheen/project/Sonikoma/backend/app/services/audio/audio.py"
whisper_path = "C:/Users/dheen/project/Sonikoma/backend/app/services/audio/whisper_engine.py"
librosa_path = "C:/Users/dheen/project/Sonikoma/backend/app/services/audio/librosa_engine.py"

process_file(whisper_path, whisper_methods, rewrite_whisper, audio_path)
process_file(librosa_path, librosa_methods, rewrite_librosa, audio_path)

print("Extraction completed!")
