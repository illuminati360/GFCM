# Anki Addon for Making German Flashcards
## build
```
# compile ui
mkdir -p forms
pyuic6 designer/flashcardmaker.ui -o forms/flashcardmaker.py

# install dep
DEP_DIR=dep
python -m venv $DEP_DIR
source $DEP_DIR/bin/activate
python -m spacy download de_core_news_sm
```

## Change log
#### init:
- hello world!
#### v0.0.2:
- added support for other parts of speech
- fixed image paste
#### v0.0.3:
- added word group and sentence
- 3rd party dep

## TODOs:
- eudict integration (sync glossary)
- preview and export pdf for printing
- grammar
- formalize and packaging