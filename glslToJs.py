f = open("file.txt", "r")

lines = f.readlines()

s = "[\n"
for line in lines:
    s +='"'
    if line[-1] == '\n':
        s += line[:-1]
    else:
        s += line
    s += '",\n'
s += "]"

print(s)


