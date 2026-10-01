fetch(){
    curl -L -o source.pdf $1;
}

msld(){
    bash pdftoslides.sh source.pdf ./
}

push(){
    git add ./;
    git commit -m "$1";
    git push origin main;
}