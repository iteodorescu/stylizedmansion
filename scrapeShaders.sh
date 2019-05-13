
for file in *; do 
    if [ -f "$file" ]; then 
        echo "<script src='shaders/$file'></script>" 
    fi 
done