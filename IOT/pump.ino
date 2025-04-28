#include <Wire.h>
#include <LiquidCrystal_I2C.h>


LiquidCrystal_I2C lcd(0x27, 16, 2);


// Nút
#define BTN_UP     9
#define BTN_DOWN   10
#define BTN_LEFT   11
#define BTN_RIGHT  8
#define BTN_START  12


// Motor pin
#define DIR_PIN    2
#define STEP_PIN   3
// Microstep pins cho DRV8825 (1/16 step)
#define M0_PIN     6
#define M1_PIN     5
#define M2_PIN     4
#define LIMIT_SWITCH_PIN 7


// Thông số motor + vít me
const float MOTOR_STEPS_PER_REV = 200.0;  // 1.8°/step → 200 step/rev
const int   MICROSTEPPING        = 1;    // 1/16 microstep
const float ONE_REV_PER_ML = 0.6;  // 1ml ≈ 0.6mm

// Số bước trên mỗi ml
const float STEPS_PER_ML = MOTOR_STEPS_PER_REV * MICROSTEPPING / ONE_REV_PER_ML;



enum State { MODE_SELECT, ML_SELECT, RUNNING, PAUSED, DONE, TIME };
State currentState = MODE_SELECT;


bool isHut = true;
int selectedIndex = 0;


float volume = 10.0;
float currentVolume = 0.0;
float previousVolume = 0.0;  // Lưu giá trị trước đó để tính lượng cần bơm


unsigned long lastBlink = 0;
bool blinkState = true;

//Thời gian bơm
const float PUMP_TIME = 30.0; // 30s
int time = round(volume);



void setup() {
  // Khởi tạo LCD
  lcd.init();
  lcd.backlight();


  // Khởi tạo các nút
  pinMode(BTN_UP, INPUT_PULLUP);
  pinMode(BTN_DOWN, INPUT_PULLUP);
  pinMode(BTN_LEFT, INPUT_PULLUP);
  pinMode(BTN_RIGHT, INPUT_PULLUP);
  pinMode(BTN_START, INPUT_PULLUP);


  // Cấu hình motor
  pinMode(DIR_PIN, OUTPUT);
  pinMode(STEP_PIN, OUTPUT);
 
  // Cấu hình microstep (1/16 step)
  pinMode(M0_PIN, OUTPUT); digitalWrite(M0_PIN, LOW);
  pinMode(M1_PIN, OUTPUT); digitalWrite(M1_PIN, LOW);
  pinMode(M2_PIN, OUTPUT); digitalWrite(M2_PIN, LOW);
  
  pinMode(LIMIT_SWITCH_PIN, INPUT_PULLUP);  // Vì là NO - bình thường HIGH, nhấn thì LOW

  updateLCD();
  delay(5000);
}


void loop() {
  // Nhấp nháy khi chọn chế độ
  if (millis() - lastBlink > 500 && currentState == MODE_SELECT) {
    blinkState = !blinkState;
    lastBlink = millis();
    updateLCD();
  }


  // Nút UP
  if (digitalRead(BTN_UP) == LOW) {
    if (currentState == MODE_SELECT) {
      selectedIndex = 0;
      isHut = true;
    } else if (currentState == ML_SELECT && volume < 25.0) {
      volume += 1.0;
    } else if (currentState == TIME) {
      time++;
      updateLCD();
    } else if (currentState == RUNNING) {
      currentState = PAUSED;
      updateLCD();
    }
    delay(200);
    updateLCD();
  }


  // Nút DOWN
  if (digitalRead(BTN_DOWN) == LOW) {
    if (currentState == MODE_SELECT) {
      selectedIndex = 1;
      isHut = false;
    } else if (currentState == ML_SELECT && volume > 1.0) {
      volume -= 1.0;
    } else if (currentState == TIME && time > round(volume) ) {
      time--;  
      updateLCD();
    } else if (currentState == PAUSED) {
      currentState = RUNNING;
      previousVolume = currentVolume;  // Lưu lại giá trị khi tiếp tục
      updateLCD();
    }
    delay(200);
    updateLCD();
  }


  // Nút LEFT: giảm 0.1
  if (digitalRead(BTN_LEFT) == LOW && currentState == ML_SELECT) {
    if (volume > 0.1) {
      volume -= 0.1;
      volume = round(volume * 100) / 100.0;
    }
    delay(150);
    updateLCD();
  }


  // Nút RIGHT: tăng 0.1
  if (digitalRead(BTN_RIGHT) == LOW && currentState == ML_SELECT) {
    if (volume < 24.9) {
      volume += 0.1;
      volume = round(volume * 100) / 100.0;
    }
    delay(150);
    updateLCD();
  }


  // Nút START
  if (digitalRead(BTN_START) == LOW) {
    if (currentState == MODE_SELECT) {
      currentState = ML_SELECT;
    } else if (currentState == ML_SELECT) {
      currentState = TIME;
      previousVolume = currentVolume = isHut ? 0.0 : volume;
    } else if (currentState == TIME) {
      currentState = RUNNING;
    } else if (currentState == DONE || currentState == PAUSED) {
      currentState = MODE_SELECT;
    }
    delay(300);
    updateLCD();
  }


  // Quá trình bơm
  if (currentState == RUNNING) {
    float targetVolume;
    float stepVolume = 0.1; // Lượng ml mỗi bước

    // Tính thời gian cần bơm cho mỗi ml
    float timePerMl = time / volume; // Thời gian bơm cho 1 ml
    float timePerStep = timePerMl * stepVolume; // Thời gian mỗi bước bơm

    // Xác định lượng dịch chuyển
    if (isHut) {
      targetVolume = currentVolume + stepVolume;
      if (targetVolume > volume) targetVolume = volume;
    } else {
      targetVolume = currentVolume - stepVolume;
      if (targetVolume < 0) targetVolume = 0;
    }


    // Tính lượng ml cần di chuyển
    float deltaVolume = targetVolume - currentVolume;
   
    // Di chuyển motor theo lượng ml
    if (deltaVolume != 0) {
      moveMl(deltaVolume);
      currentVolume = targetVolume;
    }


    // Hiển thị trạng thái
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("Dang ");
    lcd.print(isHut ? "HUT" : "DAY");
    lcd.setCursor(0, 1);
    lcd.print(currentVolume, 2);
    lcd.print(" ml");


    // Kiểm tra hoàn thành
    if ((isHut && currentVolume >= volume) || (!isHut && currentVolume <= 0)) {
      currentState = DONE;
      updateLCD();
    }
   
    delay(100); // Delay để LCD hiển thị ổn định
    delay(timePerStep * 1000 - 100); // Delay dựa trên thời gian mỗi bước
  }


  // Nếu đang tạm dừng
  if (currentState == PAUSED) {
    lcd.clear();
    lcd.setCursor(0, 0);
    lcd.print("TAM DUNG");
    lcd.setCursor(0, 1);
    lcd.print(currentVolume, 2);
    lcd.print(" ml");
  }
}


// Hiển thị màn hình LCD
void updateLCD() {
  lcd.clear();


  if (currentState == MODE_SELECT) {
    lcd.setCursor(0, 0);
    if (selectedIndex == 0 && blinkState) lcd.print("> "); else lcd.print("  ");
    lcd.print("HUT");


    lcd.setCursor(0, 1);
    if (selectedIndex == 1 && blinkState) lcd.print("> "); else lcd.print("  ");
    lcd.print("DAY");


  } else if (currentState == ML_SELECT) {
    lcd.setCursor(0, 0);
    lcd.print("Chon so ml:");
    lcd.setCursor(0, 1);
    lcd.print(volume, 2);
    lcd.print(" ml");


  } else if (currentState == DONE) {
    lcd.setCursor(0, 0);
    lcd.print("Da ");
    lcd.print(isHut ? "HUT" : "DAY");
    lcd.setCursor(0, 1);
    lcd.print(volume, 2);
    lcd.print(" ml");
  }
  else if (currentState == TIME) {
    lcd.setCursor(0, 0);
    lcd.print("CHON THOI GIAN");
    lcd.setCursor(0, 1);
    lcd.print(time);
    lcd.print("s");
  }
}


/**
 * Di chuyển motor để bơm hoặc hút theo đơn vị ml.
 * ml: thể tích cần bơm (+) hoặc hút (-)
 */
void moveMl(float ml) {
  
  long steps = lround(ml * STEPS_PER_ML);

  // Đặt hướng motor
  if (ml >= 0) digitalWrite(DIR_PIN, LOW);
  else digitalWrite(DIR_PIN, HIGH);


  for (long i = 0; i < abs(steps); i++) {
    // Nếu limit switch bị nhấn thì dừng ngay
    if (digitalRead(LIMIT_SWITCH_PIN) == LOW) {
      lcd.clear();
      lcd.setCursor(0, 0);
      lcd.print("Limit bi cham!");
      lcd.setCursor(0, 1);
      lcd.print("Dung motor");
      currentState = DONE;
      return;  
    }

    digitalWrite(STEP_PIN, HIGH);
    delayMicroseconds(100);
    digitalWrite(STEP_PIN, LOW);
    delayMicroseconds(1000);
  }
  
}
