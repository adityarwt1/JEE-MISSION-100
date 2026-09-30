fetch(){
    curl -L -o source.pdf $1;
}

msld(){
    bash pdftoslides.sh source.pdf ./
}