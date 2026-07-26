class Student:
    def __init__(self, name):
        self.name = name
        self.grades = []
    def add_grade(self, grade):
        return self.grades.append(grade)
    def average(self):
        return sum(self.grades) / len(self.grades)
s1 = Student("Anya")
s2 = Student("Vitya")
s3 = Student("Dima")
s1.add_grade(5)
s1.add_grade(2)
s1.add_grade(5)

s2.add_grade(4)
s2.add_grade(4)
s2.add_grade(5)

s3.add_grade(5)
s3.add_grade(5)
s3.add_grade(5)
students  = [s1, s2, s3]

best = max(students, key=lambda s: s.average())
print(best.name)