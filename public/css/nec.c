#include<bits/stdc++.h>**
** #define ll long long int**

** using namespace std;**

** int counter;**

** bool anyNonZero = false;**

** ll powerOf10[19];**

** bool compare(const int& a, const int& b){**

** ll wa = a;**

** wa/=powerOf10[min(18, 5*(counter-1))];**

** wa%=powerOf10[min(18, 5counter - 5(counter-1))];**

** ll wb = b;**

** wb/=powerOf10[min(18, 5*(counter-1))];**

** wb%=powerOf10[min(18, 5counter - 5(counter-1))];**

** if(wa!=0 || wb!=0) anyNonZero=true;**

** return wa<wb;**

** }**

** void print(vector& num){**

** for(int i=0;i<num.size();i++){**

** cout << num[i] << " ";**

** }**

** cout << endl;**

** }**

** int main(){**

** int n;**

** cin >> n;**

** powerOf10[0]=1;**

** for(int i=1;i<=18;i++) powerOf10[i]=powerOf10[i-1]10;*

** vector num(n);**

** for(int i=0;i<n;i++) cin >> num[i];**

** counter = 1;**

** while(true){**

** anyNonZero = false;**

** stable_sort(num.begin(), num.end(), compare);**

** if(!anyNonZero) break;**

** print(num);**

** counter++;**

** }**

** return 0;**

** }**